const categoryNames: Record<string,string> = {
  "streaming-tv":"البث التلفزيوني والترفيه","music-audio":"الموسيقى والصوتيات","gaming-gift-cards":"الألعاب وبطاقات الهدايا","apple-services":"خدمات Apple","software-ai":"البرامج والذكاء الاصطناعي","vpn-security":"الحماية والخصوصية","cloud-storage":"التخزين السحابي","productivity":"الإنتاجية وتنظيم العمل","design-creative":"التصميم والإبداع","creator-social-tools":"صناعة المحتوى وأدوات التواصل"
};

const slugWords: Record<string,string> = { "premium":"مميز","plus":"بلس","pro":"احترافي","plan":"باقة","pass":"اشتراك","pack":"حزمة","bundle":"باقة","toolkit":"مجموعة أدوات","tools":"أدوات","tool":"أداة","credit":"رصيد","wallet":"محفظة","store":"متجر","gift":"هدية","card":"بطاقة","family":"عائلي","student":"طلاب","kids":"أطفال","viewing":"مشاهدة","entertainment":"ترفيه","movie":"أفلام","movies":"أفلام","cinema":"سينما","sports":"رياضة","live":"مباشر","tv":"تلفزيون","music":"موسيقى","audio":"صوتيات","podcast":"بودكاست","artist":"فنان","gaming":"ألعاب","game":"لعبة","pc":"كمبيوتر","console":"منصة ألعاب","online":"عبر الإنترنت","cloud":"سحابي","storage":"تخزين","drive":"مساحة تخزين","backup":"نسخ احتياطي","secure":"آمن","security":"حماية","vpn":"VPN","antivirus":"مضاد فيروسات","device":"جهاز","support":"دعم","assistant":"مساعد","ai":"ذكاء اصطناعي","writing":"كتابة","research":"بحث","workspace":"مساحة عمل","team":"فريق","task":"مهام","manager":"إدارة","time":"وقت","tracking":"تتبع","calendar":"تقويم","email":"بريد إلكتروني","productivity":"إنتاجية","business":"أعمال","document":"مستندات","design":"تصميم","photo":"صور","editing":"تحرير","motion":"حركة","graphics":"رسومات","illustration":"رسم توضيحي","template":"قالب","templates":"قوالب","brand":"علامة تجارية","identity":"هوية","starter":"تأسيس","stock":"جاهز","creative":"إبداعي","suite":"مجموعة","social":"اجتماعي","analytics":"تحليلات","content":"محتوى","planner":"مخطط","scheduler":"جدولة","thumbnail":"صورة مصغرة","short":"قصير","video":"فيديو","creator":"صانع محتوى","service":"خدمة","services":"خدمات","access":"وصول","subscription":"اشتراك","month":"شهر","months":"أشهر","day":"يوم","days":"أيام","year":"سنة","years":"سنوات","standard":"قياسي" };

const titlePhrases: Array<[string,string]> = [
  ["premium-entertainment-pass","باقة ترفيه مميزة"],["entertainment-plus","ترفيه بلس"],["annual-entertainment-plan","باقة الترفيه السنوية"],["family-viewing-plan","باقة مشاهدة عائلية"],["premium-viewing-pass","باقة مشاهدة مميزة"],["cinema-night-pass","باقة ليلة سينمائية"],["weekend-movie-pack","باقة أفلام نهاية الأسبوع"],["sports-live-tv-access","اشتراك الرياضة والبث المباشر"],["kids-family-pack","باقة الأطفال والعائلة"],
  ["music-podcast-bundle","باقة الموسيقى والبودكاست"],["family-music-plan","باقة موسيقى عائلية"],["student-music-plan","باقة موسيقى للطلاب"],["music-service-plan","باقة خدمة الموسيقى"],["music-premium","اشتراك موسيقى بريميوم"],["hi-fi-audio-pass","باقة استماع صوتي عالي الجودة"],["podcast-plus","بودكاست بلس"],["artist-toolkit","حزمة أدوات الفنان"],
  ["game-store-credit","رصيد متجر ألعاب"],["gaming-gift-credit","رصيد هدايا الألعاب"],["pc-gaming-wallet","رصيد ألعاب الكمبيوتر"],["console-online-pass","اشتراك اللعب عبر الإنترنت"],["game-store","متجر الألعاب"],
  ["app-store-gift-credit","رصيد متجر التطبيقات"],["device-support-plan","باقة دعم الأجهزة"],["cloud-backup","نسخ احتياطي سحابي"],["ai-assistant-pro","مساعد ذكاء اصطناعي احترافي"],["ai-writing-credits","رصيد الكتابة بالذكاء الاصطناعي"],["ai-research-tools","أدوات البحث بالذكاء الاصطناعي"],
  ["vpn-premium","اشتراك VPN مميز"],["antivirus","مضاد فيروسات"],["secure-backup","نسخ احتياطي آمن"],["cloud-storage","مساحة تخزين سحابية"],["cloud-drive","مساحة تخزين سحابية"],["team-storage","تخزين سحابي للفريق"],["file-transfer-pro","نقل ملفات احترافي"],
  ["team-workspace","مساحة عمل جماعية"],["task-manager-pro","إدارة مهام احترافية"],["time-tracking-pro","تتبع الوقت"],["calendar-plus","تقويم بلس"],["email-productivity","أدوات تنظيم البريد الإلكتروني"],["business-document-suite","حزمة مستندات الأعمال"],
  ["design-toolkit","حزمة أدوات التصميم"],["photo-editing-pro","تحرير الصور الاحترافي"],["motion-graphics-tools","أدوات الرسوم المتحركة"],["illustration-tools","أدوات الرسم الرقمي"],["premium-template-pack","حزمة قوالب مميزة"],["brand-identity-starter-kit","حزمة تأسيس الهوية البصرية"],["stock-graphics-pack","حزمة عناصر ورسومات جاهزة"],["creative-suite-bundle","حزمة الأدوات الإبداعية"],
  ["social-analytics","تحليلات منصات التواصل"],["content-planner","مخطط المحتوى"],["content-scheduler","جدولة المحتوى"],["thumbnail-design-pack","حزمة تصميم الصور المصغرة"],["short-video-creator-toolkit","حزمة صناعة الفيديو القصير"]
];

function periodText(slug: string) {
  const match = slug.match(/(\d+)-(month|months|days|year|years)/);
  if (!match) return "";
  const count = Number(match[1]);
  const unit = match[2];
  if (unit.startsWith("month")) return count === 1 ? "لمدة شهر واحد" : `لمدة ${count} أشهر`;
  if (unit.startsWith("day")) return `لمدة ${count} يومًا`;
  if (unit.startsWith("year")) return count === 1 ? "لمدة سنة واحدة" : `لمدة ${count} سنوات`;
  return "";
}

export function arabicCategoryName(slug: string, fallback: string) {
  return categoryNames[slug] || fallback;
}

export function localizeProduct<T extends Record<string, any>>(product: T, language: string): T {
  if (language !== "ar") return product;
  const slug = String(product.slug || "");
  const phrase = titlePhrases.find(([key]) => slug.includes(key));
  let title = phrase?.[1] || slug.split("-").filter(part => !/^\\d+$/.test(part) && !["1","3","6","12","24","30","50","100","200","500","2","5","10","20","25"].includes(part)).map(part => slugWords[part] || part.toUpperCase()).join(" ");
  const duration = periodText(slug);
  if (duration && !title.includes(duration)) title += ` — ${duration}`;
  const amount = slug.match(/(\d+)(gb|tb)/);
  if (amount) title += ` — ${amount[1]} ${amount[2].toUpperCase()}`;
  const priceValue = slug.match(/(?:credit|wallet)-(\d+)/);
  if (priceValue) title += ` بقيمة ${priceValue[1]} دولار`;
  const shortDescription = `خدمة رقمية ${title}. اختر الباقة المناسبة وراجع المدة والتفاصيل قبل إتمام الطلب.`;
  const description = `${shortDescription}\n\nيتم تنفيذ الطلب يدويًا بعد تأكيد الدفع ومراجعة تفاصيل الطلب. سيتواصل فريق المتجر معك لتسليم الخدمة أو تفعيلها عبر صفحة الطلب أو محادثة الدعم. لا يتضمن هذا المنتج بيانات دخول أو رموز تفعيل جاهزة قبل الشراء.`;
  const deliveryInstructions = "بعد تأكيد الدفع، يراجع فريق المتجر الطلب ثم يرسل تفاصيل التفعيل أو التسليم من خلال صفحة الطلب أو محادثة الدعم. لا توجد بيانات دخول أو رموز جاهزة مخزنة مسبقًا لهذا المنتج.";
  const category = product.categoryId && typeof product.categoryId === "object"
    ? { ...product.categoryId, name: arabicCategoryName(String(product.categoryId.slug || ""), String(product.categoryId.name || "")) }
    : product.categoryId;
  return { ...product, title, shortDescription, description, deliveryInstructions, categoryId: category };
}
