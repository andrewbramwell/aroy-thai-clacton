module.exports = {
    name: "Aroy Thai",
    email: "info@aroythaiclacton.co.uk",
    phoneForTel: "+447915195855",
    phoneFormatted: "07915 195855",
    phone2ForTel: "+441255435599",
    phone2Formatted: "01255 435599",
    menuLink: "https://aroythai.resos.com/booking",
    address: {
        lineOne: "19 Rosemary Rd",
        lineTwo: "",
        city: "Clacton-on-Sea",
        state: "",
        zip: "CO15 1NZ",
        country: "UK",
        mapLink: "https://maps.app.goo.gl/eABGTEHWqi9Abmaw5",
    },
    socials: {
        facebook: "",
        instagram: "",
    },
    //! Make sure you include the file protocol (e.g. https://) and that NO TRAILING SLASH is included
    domain: "https://www.aroythaiclacton.co.uk",
    // Passing the isProduction variable for use in HTML templates
    isProduction: process.env.ELEVENTY_ENV === "PROD",
};