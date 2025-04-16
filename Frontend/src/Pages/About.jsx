import image from ".././assets/Hero_Image/image1.jpg";
import ActiveCustomer from "../Components/About/ActiveCustomer";
import GallaryImage from "../Components/About/GallaryImage";
import RecentlyBlogPost from "../Components/Blog/RecentlyBlogPost";
import WhyChooseUs from "../Components/WhyChooseUs";

const About = () => {
  return (
    <section className="container  mx-auto md:mt-10     space-y-14 transition-colors duration-300">
      {/* First Section */}
      <div className="">
        <div className="grid grid-cols-1 p-5 lg:p-0 gap-10 lg:grid-cols-2">
          {/* Image Section */}
          <div className="flex  order-1 lg:order-2 justify-center">
            <img
              src='/image1.jpg'
              alt="Print Shop"
              className="w-full h-[200px] md:h-[350px] lg:h-[400px] object-cover rounded-lg shadow-xl transform  transition-transform duration-300"
            />
           
          </div>

          {/* Info Section */}
          <div className="space-y-4 order-2 lg:order-1">
            <h1 className="text-xl md:text-2xl lg:text-3xl font-Ray_black font-bold text-gray-800 dark:text-white mb-2">
              درباره مطبعه تمدن
            </h1>

            <div className="space-y-6">
              {/* Section 1: Introduction */}
              <div>
              
                <p className="text-gray-700 dark:text-gray-300 text-justify leading-relaxed">
                  چاپخانه ما، که از دل آرزوهای فرهنگی و صنعتی جامعه برآمده،
                  نمادی از هم‌افزایی هنر و صنعت است. این مکان به مرکزی تبدیل شده
                  که در آن نه تنها کلمات و تصاویر به زندگی می‌آیند، بلکه ایده‌ها
                  و افکار نیز پرورش می‌یابند. ما با هدف اعتلای فرهنگ و رشد صنعت،
                  به عنوان پل ارتباطی میان فرهنگیان و عموم مردم عمل می‌کنیم.
                </p>
              </div>

              {/* Section 2: Vision and Mission */}
              <div>
                <h2 className="text-md md:text-xl font-semibold text-gray-800 dark:text-white mb-3">
                  چشم‌انداز و ماموریت ما
                </h2>
                <p className="text-gray-700 dark:text-gray-300 text-justify leading-relaxed">
                  در این فضا، هر کارگر و هنرمند با افتخار به نقش خود در تاریخ
                  فرهنگی جامعه‌اش آگاه است و به همین دلیل، این چاپخانه نه تنها
                  محلی برای چاپ، بلکه مکانی برای شکل‌دهی به آینده‌ای روشن‌تر
                  است. با شعار «تلاقی کیفیت و نوآوری»، ما به دنبال تولید محصولات
                  فرهنگی هستیم که نه تنها بر روی کاغذ، بلکه در دل‌ها و ذهن‌های
                  مردم جای می‌گیرند.
                </p>
              </div>

              {/* Section 3: Services */}
              <div>
                <h2 className="text-md md:text-xl font-semibold text-gray-800 dark:text-white mb-3">
                  خدمات ما
                </h2>
                <p className="text-gray-700 dark:text-gray-300 text-justify leading-relaxed">
                  چاپخانه ما با ارائه مجموعه‌ای گسترده از خدمات چاپ، به نیازهای
                  فرهنگی و صنعتی جامعه با درنظر داشت قیمت رقابتی و مناسب پاسخ
                  می‌دهد. از چاپ دیجیتال و آفست گرفته تا گزینه‌های متنوع دیگر،
                  ما توانایی تولید انواع محصولات چاپی مانند کتاب‌ها، مجله،
                  بروشورها و بسته‌بندی‌ها را داریم.
                </p>
              </div>

              {/* Section 4: Technology and Equipment */}
              <div>
                <h2 className="text-md md:text-xl font-semibold text-gray-800 dark:text-white mb-3">
                  فناوری و تجهیزات
                </h2>
                <p className="text-gray-700 dark:text-gray-300 text-justify leading-relaxed">
                  این چاپخانه مجهز به ماشین‌آلات مطلوب و تجهیزات روز است. این
                  ماشین‌آلات با فناوری‌های نوین، امکان چاپ با کیفیت بالا و دقت
                  بی‌نظیر را فراهم می‌کنند. از روش‌های مدرن برای کاهش زمان تولید
                  گرفته تا ماشین‌های بزرگ‌مقیاس که توانایی چاپ در حجم‌های بالا
                  را دارند، هر کدام به ما کمک می‌کند تا به بهترین شکل ممکن به
                  نیازهای مشتریان پاسخ دهیم.
                </p>
              </div>

              {/* Section 5: Commitment to Quality */}
              <div>
                <h2 className="text-md md:text-xl font-semibold text-gray-800 dark:text-white mb-3">
                  تعهد به کیفیت
                </h2>
                <p className="text-gray-700 dark:text-gray-300 text-justify leading-relaxed">
                  چاپخانه ما نماد هم‌افزایی هنر و صنعت است و به مرکزی برای پرورش
                  ایده‌ها تبدیل شده است. ما خدمات چاپ دیجیتال و آفست را با
                  قیمت‌های رقابتی ارائه می‌دهیم و مجهز به ماشین‌آلات مطلوب هستیم
                  که کیفیت و دقت بالایی را تضمین می‌کنند. هدف ما پاسخگویی به
                  نیازهای مشتریان و ارتقای استانداردهای صنعت است.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div>
        <WhyChooseUs />
        <ActiveCustomer />
        <GallaryImage />
      </div>
      <RecentlyBlogPost />
    </section>
  );
};

export default About;
