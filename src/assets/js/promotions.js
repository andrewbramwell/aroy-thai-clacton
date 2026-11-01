(() => {
	// Configuration
	const CONFIG = {
		INTERVAL: 5000,
		SWIPE_THRESHOLD: 40,
		SELECTORS: {
			root: "#promotions",
			track: ".cs-track",
			slide: ".cs-slide",
			prev: ".cs-prev",
			next: ".cs-next",
			controls: ".cs-controls",
			play: ".cs-play",
			dot: ".cs-dot",
			caption: ".cs-caption",
		},
		CLASSES: {
			paused: "cs-paused",
		},
	};

	const root = document.querySelector(CONFIG.SELECTORS.root);
	if (!root) return;

	// The page is only rebuilt on deploy, so drop any promotions that have ended since then
	const now = Date.now();
	root.querySelectorAll(CONFIG.SELECTORS.slide).forEach((slide, i) => {
		if (Date.parse(slide.dataset.expires) <= now) {
			slide.remove();
			root.querySelectorAll(CONFIG.SELECTORS.dot)[i].dataset.expired = "true";
		}
	});
	root.querySelectorAll(`${CONFIG.SELECTORS.dot}[data-expired]`).forEach((dot) => dot.remove());

	// DOM Elements
	const elements = {
		track: root.querySelector(CONFIG.SELECTORS.track),
		slides: [...root.querySelectorAll(CONFIG.SELECTORS.slide)],
		dots: [...root.querySelectorAll(CONFIG.SELECTORS.dot)],
		prev: root.querySelector(CONFIG.SELECTORS.prev),
		next: root.querySelector(CONFIG.SELECTORS.next),
		controls: root.querySelector(CONFIG.SELECTORS.controls),
		play: root.querySelector(CONFIG.SELECTORS.play),
		caption: root.querySelector(CONFIG.SELECTORS.caption),
	};

	const total = elements.slides.length;
	if (total === 0) {
		root.hidden = true;
		return;
	}

	// Renumber in case any slides expired
	elements.slides.forEach((slide, i) => slide.setAttribute("aria-label", `${i + 1} of ${total}`));
	elements.dots.forEach((dot, i) => dot.setAttribute("aria-label", `Show promotion ${i + 1} of ${total}`));

	const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

	// State
	let current = 0;
	let timer = null;
	let userPaused = reducedMotion; // set by the pause/play button
	let hovered = false;
	let focused = false;

	// Start fetching the next banner so it's ready before it slides in, but not until the page itself has loaded
	let pageLoaded = document.readyState === "complete";
	const preloadNext = () => {
		if (!pageLoaded) return;
		const upcoming = elements.slides[(current + 1) % total].querySelector("img");
		upcoming.loading = "eager";
	};
	window.addEventListener("load", () => {
		pageLoaded = true;
		preloadNext();
	});

	// Slides
	const show =(index, { moveFocus = false } = {}) => {
		current = (index + total) % total;
		elements.track.style.transform = `translateX(-${current * 100}%)`;

		elements.slides.forEach((slide, i) => {
			slide.inert = i !== current;
		});
		elements.dots.forEach((dot, i) => {
			if (i === current) dot.setAttribute("aria-current", "true");
			else dot.removeAttribute("aria-current");
		});
		elements.caption.textContent = elements.slides[current].dataset.caption;

		preloadNext();

		if (moveFocus) elements.slides[current].querySelector("a").focus();
	};

	// Autoplay
	const isPlaying = () => timer !== null;

	const stop = () => {
		clearTimeout(timer);
		timer = null;
	};

	const update = () => {
		const shouldPlay = total > 1 && !userPaused && !hovered && !focused && !document.hidden;
		stop();
		if (shouldPlay) {
			timer = setTimeout(() => {
				timer = null;
				show(current + 1);
				update();
			}, CONFIG.INTERVAL);
		}
		// Announce slide changes only when the visitor is in control, not on every automatic rotation
		elements.caption.setAttribute("aria-live", isPlaying() ? "off" : "polite");
	};

	const setUserPaused = (paused) => {
		userPaused = paused;
		elements.play.classList.toggle(CONFIG.CLASSES.paused, paused);
		elements.play.setAttribute("aria-label", paused ? "Play promotions" : "Pause promotions");
		update();
	};

	// Controls only make sense with more than one slide
	if (total > 1) elements.controls.hidden = false;
	// No autoplay at all for visitors who prefer reduced motion
	if (reducedMotion) elements.play.hidden = true;

	// Event Handlers
	// Each manual change restarts the 5 second countdown
	elements.prev.addEventListener("click", () => {
		show(current - 1);
		update();
	});
	elements.next.addEventListener("click", () => {
		show(current + 1);
		update();
	});
	elements.dots.forEach((dot, i) =>
		dot.addEventListener("click", () => {
			show(i);
			update();
		})
	);
	elements.play.addEventListener("click", () => setUserPaused(!userPaused));

	root.addEventListener("keydown", (event) => {
		if (total < 2 || (event.key !== "ArrowLeft" && event.key !== "ArrowRight")) return;
		event.preventDefault();
		// Keep focus on the banner if that's where it was, since the old one becomes inert
		const onSlide = event.target.closest(CONFIG.SELECTORS.slide) !== null;
		show(current + (event.key === "ArrowRight" ? 1 : -1), { moveFocus: onSlide });
	});

	// Swipe
	let touchStart = null;
	elements.track.addEventListener(
		"touchstart",
		(event) => {
			touchStart = { x: event.touches[0].clientX, y: event.touches[0].clientY };
		},
		{ passive: true }
	);
	elements.track.addEventListener(
		"touchend",
		(event) => {
			if (!touchStart || total < 2) return;
			const dx = event.changedTouches[0].clientX - touchStart.x;
			const dy = event.changedTouches[0].clientY - touchStart.y;
			touchStart = null;
			if (Math.abs(dx) > CONFIG.SWIPE_THRESHOLD && Math.abs(dx) > Math.abs(dy)) {
				show(current + (dx < 0 ? 1 : -1));
				update();
			}
		},
		{ passive: true }
	);

	// Pause on hover, keyboard focus and hidden tab
	// Hover is mouse only, as a tap on a phone never sends a matching "leave"
	root.addEventListener("pointerenter", (event) => {
		if (event.pointerType !== "mouse") return;
		hovered = true;
		update();
	});
	root.addEventListener("pointerleave", (event) => {
		if (event.pointerType !== "mouse") return;
		hovered = false;
		update();
	});
	// Only keyboard focus pauses, otherwise clicking an arrow would stop autoplay until the visitor clicks elsewhere
	root.addEventListener("focusin", (event) => {
		focused = event.target.matches(":focus-visible");
		update();
	});
	root.addEventListener("focusout", (event) => {
		if (root.contains(event.relatedTarget)) return;
		focused = false;
		update();
	});
	document.addEventListener("visibilitychange", update);

	// Initialize
	show(0);
	setUserPaused(userPaused);
})();
