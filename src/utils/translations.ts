import { LanguageCode } from '../types';

export const TRANSLATIONS: Record<LanguageCode, Record<string, string>> = {
  en: {
    app_title: 'TORSHA BAZAAR',
    tagline: 'Local Market • Better Life',
    search_placeholder: 'Search brand-new mobiles, groceries, medicines, meat...',
    change_area: 'Change Area',
    scan_qr: 'Universal QR',
    roles_switch: 'Roles',
    home: 'Home',
    categories: 'Categories',
    orders: 'My Orders',
    account: 'Account',
    more: 'More',
    pwa_install: 'Install App',
    pwa_install_ios: 'Install on iPhone',
    
    // Services
    service_kirana: 'Kirana & Grocery',
    service_medical: 'Medical Shop',
    service_meat: 'Fresh Meat & Chicken',
    service_mobiles: 'Brand-New Mobiles',
    service_scrap: 'Sell Scrap (Kabari)',
    service_taxi: 'Taxi Booking',
    service_auto: 'Auto Rickshaw',
    service_toto: 'Toto (E-Rickshaw)',
    service_courier: 'Local Delivery',
    service_services: 'Home Services',
    service_jobs: 'Local Jobs',

    // Hyperlocal Banners
    serving_in: 'Serving in',
    local_first_notice: 'Showing verified shops in',
    expand_search_prompt: 'Item not found in your locality. Would you like to view nearby stores?',
    expand_button: 'Explore Nearby Stores',
    keep_local: 'Stay in my locality',

    // Medical
    prescription_required: 'Doctor Prescription Required',
    upload_prescription: 'Upload Prescription',
    verified_pharmacy: '100% Verified Pharmacy',
    legal_restriction_notice: 'Schedule H / X restricted drugs require physical prescription verification upon delivery.',

    // Meat
    weight_select: 'Select Weight',
    daily_fresh: 'Fresh Daily Cut',
    custom_weight: 'Custom Weight',
    meat_hygiene_badge: '100% Hygienic & Halal / Jhatka Certified',

    // Scrap / Kabari
    scrap_sell_title: 'Sell Scrap to Local Kabari',
    scrap_sell_desc: 'Get the highest rate for your iron, plastic, paper, and copper without leaving home!',
    post_scrap_request: 'Post Scrap Pickup',
    compare_offers: 'Compare Buyer Offers',
    cash_on_pickup: 'Instant Cash or UPI on Doorstep Pickup'
  },
  hi: {
    app_title: 'तोर्षा बाज़ार',
    tagline: 'अपना बाज़ार • बेहतर ज़िंदगी',
    search_placeholder: 'नए मोबाइल, किराना, दवाइयाँ, ताज़ा मीट खोजें...',
    change_area: 'क्षेत्र बदलें',
    scan_qr: 'मुख्य क्यूआर',
    roles_switch: 'पोर्टल बदलें',
    home: 'होम',
    categories: 'श्रेणियाँ',
    orders: 'मेरे ऑर्डर',
    account: 'अकाउंट',
    more: 'और देखें',
    pwa_install: 'ऐप इंस्टॉल करें',
    pwa_install_ios: 'iPhone पर इंस्टॉल करें',

    // Services
    service_kirana: 'किराना एवं राशन',
    service_medical: 'दवा दुकान (मेडिकल)',
    service_meat: 'ताज़ा चिकन एवं मीट',
    service_mobiles: 'नए स्मार्टफोन्स',
    service_scrap: 'कबाड़ बेचें (कबाड़ी)',
    service_taxi: 'टैक्सी बुकिंग',
    service_auto: 'ऑटो रिक्शा',
    service_toto: 'टोटो (ई-रिक्शा)',
    service_courier: 'पार्सल डिलीवरी',
    service_services: 'घरेलू सेवाएँ',
    service_jobs: 'स्थानीय नौकरियाँ',

    // Hyperlocal Banners
    serving_in: 'आपकी सेवा में:',
    local_first_notice: 'आपके नज़दीकी सत्यापित दुकानें दिखाई जा रही हैं:',
    expand_search_prompt: 'यह सामान आपकी कॉलोनी में नहीं मिला। क्या पास के इलाके से मँगाना चाहते हैं?',
    expand_button: 'आस-पास की दुकानें देखें',
    keep_local: 'केवल मेरा इलाका रखें',

    // Medical
    prescription_required: 'डॉक्टर का पर्चा अनिवार्य',
    upload_prescription: 'पर्चा (Prescription) अपलोड करें',
    verified_pharmacy: '100% सत्यापित फार्मेसी',
    legal_restriction_notice: 'नियम अनुसार कुछ दवाइयों के लिए डिलीवरी के समय ओरिजिनल पर्चा दिखाना ज़रूरी है।',

    // Meat
    weight_select: 'वज़न चुनें',
    daily_fresh: 'दैनिक ताज़ा कट',
    custom_weight: 'अपनी पसंद का वज़न',
    meat_hygiene_badge: '100% स्वच्छ एवं ताज़ा प्रमाणित',

    // Scrap / Kabari
    scrap_sell_title: 'घर बैठे कबाड़ बेचें',
    scrap_sell_desc: 'लोहा, प्लास्टिक, अखबार और तांबे का सबसे अच्छा दाम घर बैठे पाएं!',
    post_scrap_request: 'कबाड़ उठाने का अनुरोध डालें',
    compare_offers: 'कबाड़ी वालों के दाम देखें',
    cash_on_pickup: 'डोरस्टेप तौल एवं तुरंत नकद/UPI भुगतान'
  },
  bn: {
    app_title: 'তোর্ষা বাজার',
    tagline: 'আপনার স্থানীয় বাজার • সুন্দর জীবন',
    search_placeholder: 'নতুন মোবাইল, মুদিখানা, ওষুধ, তাজা মাংস খুঁজুন...',
    change_area: 'এলাকা পরিবর্তন',
    scan_qr: 'প্রধান কিউআর',
    roles_switch: 'রোল পরিবর্তন',
    home: 'হোম',
    categories: 'ক্যাটাগরি',
    orders: 'আমার অর্ডার',
    account: 'অ্যাকাউন্ট',
    more: 'আরও',
    pwa_install: 'অ্যাপ ইনস্টল করুন',
    pwa_install_ios: 'iPhone-এ ইনস্টল করুন',

    // Services
    service_kirana: 'মুদিখানা ও মুদি সামগ্রী',
    service_medical: 'মেডিকেল ও ফার্মেসি',
    service_meat: 'তাজা মুরগি ও মাংস',
    service_mobiles: 'ব্র্যান্ড নিউ মোবাইল',
    service_scrap: 'ভাঙাচোরা বিক্রি (কাবাড়ি)',
    service_taxi: 'ট্যাক্সি বুকিং',
    service_auto: 'অটো রিকশা',
    service_toto: 'টোটো বুকিং',
    service_courier: 'পার্সেল ডেলিভারি',
    service_services: 'স্থানীয় পরিষেবা',
    service_jobs: 'স্থানীয় চাকরি',

    // Hyperlocal Banners
    serving_in: 'পরিষেবা প্রদানকারী এলাকা:',
    local_first_notice: 'আপনার এলাকার যাচাইকৃত দোকানগুলি দেখানো হচ্ছে:',
    expand_search_prompt: 'এই পণ্যটি আপনার এলাকায় পাওয়া যায়নি। পাশের এলাকার দোকান থেকে দেখতে চান?',
    expand_button: 'পাশের দোকানগুলি দেখুন',
    keep_local: 'শুধু আমার এলাকা থাকুক',

    // Medical
    prescription_required: 'ডাক্তারের প্রেসক্রিপশন প্রয়োজন',
    upload_prescription: 'প্রেসক্রিপশন আপলোড করুন',
    verified_pharmacy: '১০০% বিশ্বস্ত ফার্মেসি',
    legal_restriction_notice: 'আইনি নিয়মানুযায়ী নির্দিষ্ট ওষুধের জন্য ডেলিভারির সময় আসল প্রেসক্রিপশন দেখানো বাধ্যতামূলক।',

    // Meat
    weight_select: 'ওজন নির্বাচন করুন',
    daily_fresh: 'প্রতিদিনের তাজা মাংস',
    custom_weight: 'পছন্দমতো ওজন',
    meat_hygiene_badge: '১০০% স্বাস্থ্যকর ও তাজা প্রত্যয়িত',

    // Scrap / Kabari
    scrap_sell_title: 'ঘরে বসে ভাঙাচোরা ও বাতিল মাল বিক্রি',
    scrap_sell_desc: 'লোহা, কাগজ, প্লাস্টিক ও অ্যালুমিনিয়ামের সেরা দর পান ঘরে বসেই!',
    post_scrap_request: 'মাল সংগ্রহের অনুরোধ পাঠান',
    compare_offers: 'ক্রেতাদের প্রস্তাব যাচাই করুন',
    cash_on_pickup: 'বাড়িতে ওজনের পর সাথে সাথে নগদ বা UPI পেমেন্ট'
  }
};
