import React from "react";

import Contact from "../Components/ContactUs/Contact";
import ContactDetails from "../Components/ContactUs/ContactDetails";
import SocialMediaContact from "../Components/ContactUs/SocialMediaContact";

const ContactUs = () => {
  return (
    <section>
      <ContactDetails />
      <SocialMediaContact />
      <Contact />
    </section>
  );
};

export default ContactUs;
