const { DateTime } = require("luxon");
const client = require("./client");

// Flip to true once online ordering is ready. While false, the ordering slides call the restaurant instead.
const onlineOrderingLive = false;

const orderLink = "https://aroythaiclacton.square.site";
const phoneLink = `tel:${client.phone2ForTel}`;
const orderOrPhone = onlineOrderingLive ? orderLink : phoneLink;

// Slides show in this order. Images live in src/assets/promotions/ (1920×720 WebP).
// endDate is the last day the promotion shows (UK time). Set enabled to false to hide a slide without deleting it.
const slides = [
    {
        image: "/assets/promotions/1.webp",
        alt: "Combo for One, £18.95. A starter, a Thai curry or stir-fry, and rice. Monday, Wednesday, Thursday and Sunday.",
        caption: "Combo for One · £18.95 · Mon, Wed, Thu, Sun",
        link: orderOrPhone,
        enabled: true,
        endDate: "2026-11-30",
    },
    {
        image: "/assets/promotions/2.webp",
        alt: "Premium Combo for Two, £48.95. A sharer or soup, two mains and two rice sides. Monday, Wednesday, Thursday and Sunday.",
        caption: "Premium Combo for Two · £48.95 · Mon, Wed, Thu, Sun",
        link: orderOrPhone,
        enabled: true,
        endDate: "2026-11-30",
    },
    {
        image: "/assets/promotions/3.webp",
        alt: "Free Starter Weekend, Friday and Saturday online orders. Spend £35 for 1 free starter, spend £55 for 2. Excludes Aroy Thai Platter, Bangkok Bites and Seafood Duo.",
        caption: "Free Starter Weekend · Spend £35+ · Fri, Sat",
        link: orderOrPhone,
        enabled: true,
        endDate: "2026-11-30",
    },
    {
        image: "/assets/promotions/4.webp",
        alt: "Early Bird, £16.95. Tapas or two courses, Monday, Wednesday and Thursday, 5 to 7pm.",
        caption: "Early Bird · £16.95 · Mon, Wed, Thu, 5–7pm",
        link: phoneLink,
        enabled: true,
        endDate: "2026-11-30",
    },
    {
        image: "/assets/promotions/5.webp",
        alt: "Sunday Signature Experience for two, £84.95. Prawn crackers, a sharing platter, two signature mains, two sides and two desserts, plus one free kids' meal. Drinks not included.",
        caption: "Sunday Signature Experience · £84.95 · Sun",
        link: orderOrPhone,
        enabled: true,
        endDate: "2026-11-30",
    },
];

// A slide expires at midnight UK time at the end of its endDate
const withExpiry = slides.map((slide) => ({
    ...slide,
    expires: DateTime.fromISO(slide.endDate, { zone: "Europe/London" }).plus({ days: 1 }).toUTC().toISO(),
}));

module.exports = {
    onlineOrderingLive,
    // Slides that are enabled and haven't expired at build time. promotions.js re-checks expiry in the browser.
    active: withExpiry.filter((slide) => slide.enabled && DateTime.now() < DateTime.fromISO(slide.expires)),
};
