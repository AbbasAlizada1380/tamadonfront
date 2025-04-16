const SocialMediaContact = () => {
  return (
    <div className="flex flex-col px-10 items-center justify-center">
      <div className="pt-[300px] md:pt-[90px]">
        <h1 className="text-center text-4xl text-gray-700 font-extrabold dark:text-gray-100">
          ما را دنبال کنید !
        </h1>
        <div className="flex h-[100px] md:h-[250px] mt-10 md:mt-0 justify-center items-center">
          <div className="grid grid-cols-3 justify-center md:grid-cols-3 gap-12 lg:gap-16 relative -top-8 z-10">
            {/* Social Media Icons */}
            {[
              {
                name: "فیسبوک ما",
                url: "https://www.facebook.com/",
                icon: "/Facebook-03-01-01.png", // Correct public path
              },
              {
                name: "واتساپ ما",
                url: "https://wa.me/93728215482",
                icon: "/whatsapp-03-01-01.png",
              },
              {
                name: "تلگرام ما",
                url: "https://t.me/+93772029545",
                icon: "/Telegram-01-01-01.png",
              },
            ].map(({ name, url, icon }, index) => (
              <div
                key={index}
                className="flex flex-col items-center justify-center text-white group relative"
              >
                <a
                  href={url}
                  className="dark:bg-primary shadow-lg md:h-20 md:w-20 flex items-center justify-center rounded-full transform group-hover:scale-110 transition-transform duration-300 ease-in-out"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <img
                    src={icon}
                    alt={name}
                    className="h-12 w-12 md:h-16 md:w-16"
                  />
                </a>
                <p className="absolute hidden lg:block md:top-28 top-24 text-lg text-gray-700 dark:text-gray-100 font-bold opacity-0 group-hover:opacity-100 group-hover:translate-y-2 transition-all duration-300 ease-in-out">
                  {name}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SocialMediaContact;
