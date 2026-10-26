import {
  createContext,
  useContext,
  useLayoutEffect,
  useMemo,
  useSyncExternalStore,
} from 'react'

export const languages = [
  { code: 'en', label: 'English', dir: 'ltr' },
  { code: 'he', label: 'עברית', dir: 'rtl' },
  { code: 'ar', label: 'العربية', dir: 'rtl' },
  { code: 'es', label: 'Español', dir: 'ltr' },
  { code: 'fr', label: 'Français', dir: 'ltr' },
  { code: 'de', label: 'Deutsch', dir: 'ltr' },
  { code: 'ru', label: 'Русский', dir: 'ltr' },
] as const

export type Lang = (typeof languages)[number]['code']

const en = {
  freeLong: '100% free · no account · no credits',
  freeShort: 'Free',
  eyebrow: 'QR code → printable 3D model',
  heroTitle: 'Turn any link into a QR tag you can {0}.',
  heroHighlight: 'print',
  heroText:
    'Type a link, text or Wi‑Fi login, tune the plate, and download a two-color 3MF for your printer. Everything runs in your browser — free, instant, unlimited.',
  step1: 'Content',
  step2: 'Plate',
  step3: 'Filament colors',
  tabLink: 'Link',
  tabText: 'Text',
  tabWifi: 'Wi‑Fi',
  wifiSsid: 'Network name (SSID)',
  wifiPass: 'Password',
  secOpen: 'Open network',
  qrSize: 'QR size',
  border: 'Border (each side)',
  baseThickness: 'Base thickness',
  codeHeight: 'Code height',
  cornerRadius: 'Corner radius',
  keychain: 'Keychain ring',
  errorCorrection: 'Error correction',
  base: 'Base',
  code: 'Code',
  download3mf: 'Download 3MF (2 colors)',
  downloadPngAria: 'Download PNG',
  toastTitle: '3MF downloaded',
  toastDesc:
    'Base is on filament 1 and the code on filament 2 — open it in your slicer and print.',
  smallModules:
    'Modules are under 1 mm — increase the QR size or shorten the content for a reliable scan.',
  tooLong: 'That content is too long to fit in a QR code. Try shortening it.',
  modulesInfo: '{n}×{n} modules · {mm} mm each',
  tip1Title: 'One file, two colors',
  tip1Body:
    'The 3MF holds the base and the code as two parts of one object, already assigned to filament 1 and filament 2. Open it in Bambu Studio, Orca or PrusaSlicer and print.',
  tip2Title: 'Single-color printer?',
  tip2Body:
    'Print the same 3MF with one filament, then add a pause at the first code layer to swap filament for instant contrast.',
  tip3Title: 'Built to scan',
  tip3Body:
    'Keep modules above ~1 mm, use a light base with a dark code, and pick H error correction if your tag will get scuffed.',
  footer:
    '3D QR Generator — a free, open tool for makers. Models are generated locally in your browser; nothing is uploaded.',
  install: 'Install app',
  installIos: 'On iPhone: tap Share, then “Add to Home Screen”.',
  themeToLight: 'Switch to light mode',
  themeToDark: 'Switch to dark mode',
  language: 'Language',
  c0: 'White',
  c1: 'Charcoal',
  c2: 'Orange',
  c3: 'Lime',
  c4: 'Blue',
  c5: 'Red',
  c6: 'Yellow',
  c7: 'Purple',
  loopGap: 'Ring distance',
  loopOffset: 'Ring position',
  loopSide: 'Ring side',
  sideTop: 'Top',
  sideRight: 'Right',
  sideBottom: 'Bottom',
  sideLeft: 'Left',
  sizeTotal: 'Total size: {w} × {h} × {d} mm',
  sameColors:
    'Base and code are the same color — pick contrasting colors so the code can be scanned.',
  ecTitle: 'Error correction',
  ecL: 'L — Low: recovers ~7% damage. Smallest, simplest code.',
  ecM: 'M — Medium: recovers ~15%. Good default.',
  ecQ: 'Q — Quartile: recovers ~25%. For tags that may get scratched.',
  ecH: 'H — High: recovers ~30%. Best for rough use; the code gets denser.',
}

export type Key = keyof typeof en
type Dict = Record<Key, string>

const he: Dict = {
  freeLong: 'חינם 100% · בלי חשבון · בלי קרדיטים',
  freeShort: 'חינם',
  eyebrow: 'קוד QR ← מודל תלת־ממדי להדפסה',
  heroTitle: 'הפכו כל קישור לשלט QR שאפשר {0}.',
  heroHighlight: 'להדפיס',
  heroText:
    'הקלידו קישור, טקסט או פרטי Wi‑Fi, כוונו את הלוחית, והורידו קובץ 3MF דו־צבעי למדפסת שלכם. הכול רץ בדפדפן — חינם, מיידי ובלי הגבלה.',
  step1: 'תוכן',
  step2: 'לוחית',
  step3: 'צבעי פילמנט',
  tabLink: 'קישור',
  tabText: 'טקסט',
  tabWifi: 'Wi‑Fi',
  wifiSsid: 'שם הרשת (SSID)',
  wifiPass: 'סיסמה',
  secOpen: 'רשת פתוחה',
  qrSize: 'גודל ה-QR',
  border: 'מסגרת (לכל צד)',
  baseThickness: 'עובי הבסיס',
  codeHeight: 'גובה הקוד',
  cornerRadius: 'עיגול פינות',
  keychain: 'טבעת למחזיק מפתחות',
  errorCorrection: 'תיקון שגיאות',
  base: 'בסיס',
  code: 'קוד',
  download3mf: 'הורדת 3MF (שני צבעים)',
  downloadPngAria: 'הורדת PNG',
  toastTitle: 'קובץ ה-3MF ירד',
  toastDesc: 'הבסיס בפילמנט 1 והקוד בפילמנט 2 — פתחו בסלייסר והדפיסו.',
  smallModules:
    'המודולים קטנים מ-1 מ״מ — הגדילו את גודל ה-QR או קצרו את התוכן כדי שהסריקה תהיה אמינה.',
  tooLong: 'התוכן ארוך מדי ולא נכנס בקוד QR. נסו לקצר אותו.',
  modulesInfo: '\u2066{n}×{n}\u2069 מודולים · \u2066{mm} mm\u2069 כל אחד',
  tip1Title: 'קובץ אחד, שני צבעים',
  tip1Body:
    'קובץ ה-3MF מכיל את הבסיס ואת הקוד כשני חלקים של אובייקט אחד, כבר משויכים לפילמנט 1 ולפילמנט 2. פתחו אותו ב-Bambu Studio, Orca או PrusaSlicer והדפיסו.',
  tip2Title: 'מדפסת עם צבע אחד?',
  tip2Body:
    'הדפיסו את אותו קובץ 3MF עם פילמנט אחד, והוסיפו עצירה בשכבה הראשונה של הקוד כדי להחליף פילמנט ולקבל ניגודיות מיידית.',
  tip3Title: 'בנוי לסריקה',
  tip3Body:
    'שמרו על מודולים של יותר מ-1 מ״מ בערך, השתמשו בבסיס בהיר עם קוד כהה, ובחרו תיקון שגיאות H אם השלט עלול להישרט.',
  footer:
    '3D QR Generator — כלי חופשי וחינמי ליוצרים. המודלים נוצרים מקומית בדפדפן שלכם, שום דבר לא עולה לשרת.',
  install: 'התקנת האפליקציה',
  installIos: 'באייפון: לחצו על ״שיתוף״ ואז ״הוסף למסך הבית״.',
  themeToLight: 'מעבר למצב בהיר',
  themeToDark: 'מעבר למצב כהה',
  language: 'שפה',
  c0: 'לבן',
  c1: 'פחם',
  c2: 'כתום',
  c3: 'ליים',
  c4: 'כחול',
  c5: 'אדום',
  c6: 'צהוב',
  c7: 'סגול',
  loopGap: 'מרחק הטבעת',
  loopOffset: 'מיקום הטבעת',
  loopSide: 'צד הטבעת',
  sideTop: 'למעלה',
  sideRight: 'ימין',
  sideBottom: 'למטה',
  sideLeft: 'שמאל',
  sizeTotal: 'גודל כולל: \u2066{w} × {h} × {d} mm\u2069',
  sameColors: 'צבע הבסיס והקוד זהים — בחרו צבעים מנוגדים כדי שאפשר יהיה לסרוק.',
  ecTitle: 'תיקון שגיאות',
  ecL: 'L — נמוך: משחזר כ-7% נזק. הקוד הקטן והפשוט ביותר.',
  ecM: 'M — בינוני: משחזר כ-15%. ברירת מחדל טובה.',
  ecQ: 'Q — גבוה: משחזר כ-25%. לשלטים שעלולים להישרט.',
  ecH: 'H — מרבי: משחזר כ-30%. הכי טוב לשימוש גס, הקוד נעשה צפוף יותר.',
}

const ar: Dict = {
  freeLong: 'مجاني 100% · بدون حساب · بدون رصيد',
  freeShort: 'مجاني',
  eyebrow: 'رمز QR ← نموذج ثلاثي الأبعاد للطباعة',
  heroTitle: 'حوّل أي رابط إلى لوحة QR يمكنك {0}.',
  heroHighlight: 'طباعتها',
  heroText:
    'اكتب رابطًا أو نصًا أو بيانات Wi‑Fi، واضبط اللوحة، ثم نزّل ملف 3MF بلونين لطابعتك. كل شيء يعمل داخل المتصفح — مجاني وفوري وبلا حدود.',
  step1: 'المحتوى',
  step2: 'اللوحة',
  step3: 'ألوان الخيوط',
  tabLink: 'رابط',
  tabText: 'نص',
  tabWifi: 'Wi‑Fi',
  wifiSsid: 'اسم الشبكة (SSID)',
  wifiPass: 'كلمة المرور',
  secOpen: 'شبكة مفتوحة',
  qrSize: 'حجم QR',
  border: 'الإطار (لكل جانب)',
  baseThickness: 'سماكة القاعدة',
  codeHeight: 'ارتفاع الرمز',
  cornerRadius: 'استدارة الزوايا',
  keychain: 'حلقة ميدالية مفاتيح',
  errorCorrection: 'تصحيح الأخطاء',
  base: 'القاعدة',
  code: 'الرمز',
  download3mf: 'تنزيل 3MF (لونان)',
  downloadPngAria: 'تنزيل PNG',
  toastTitle: 'تم تنزيل ملف 3MF',
  toastDesc:
    'القاعدة على الخيط 1 والرمز على الخيط 2 — افتحه في برنامج التقطيع واطبع.',
  smallModules:
    'الوحدات أصغر من 1 مم — كبّر حجم QR أو اختصر المحتوى لمسح موثوق.',
  tooLong: 'المحتوى طويل جدًا ولا يتسع في رمز QR. حاول اختصاره.',
  modulesInfo: '\u2066{n}×{n}\u2069 وحدة · \u2066{mm} mm\u2069 لكل وحدة',
  tip1Title: 'ملف واحد، لونان',
  tip1Body:
    'يحتوي ملف 3MF على القاعدة والرمز كجزأين من كائن واحد، مُسندين مسبقًا إلى الخيط 1 والخيط 2. افتحه في Bambu Studio أو Orca أو PrusaSlicer واطبع.',
  tip2Title: 'طابعة بلون واحد؟',
  tip2Body:
    'اطبع ملف 3MF نفسه بخيط واحد، ثم أضف إيقافًا مؤقتًا عند أول طبقة للرمز لتبديل الخيط والحصول على تباين فوري.',
  tip3Title: 'مصمم ليُمسح بسهولة',
  tip3Body:
    'اجعل الوحدات أكبر من 1 مم تقريبًا، واستخدم قاعدة فاتحة مع رمز داكن، واختر تصحيح الأخطاء H إذا كانت اللوحة معرضة للخدوش.',
  footer:
    '3D QR Generator — أداة مجانية ومفتوحة للصنّاع. تُنشأ النماذج محليًا في متصفحك ولا يُرفع أي شيء.',
  install: 'تثبيت التطبيق',
  installIos: 'على الآيفون: اضغط «مشاركة» ثم «إضافة إلى الشاشة الرئيسية».',
  themeToLight: 'التبديل إلى الوضع الفاتح',
  themeToDark: 'التبديل إلى الوضع الداكن',
  language: 'اللغة',
  c0: 'أبيض',
  c1: 'فحمي',
  c2: 'برتقالي',
  c3: 'ليموني',
  c4: 'أزرق',
  c5: 'أحمر',
  c6: 'أصفر',
  c7: 'بنفسجي',
  loopGap: 'بُعد الحلقة',
  loopOffset: 'موضع الحلقة',
  loopSide: 'جهة الحلقة',
  sideTop: 'أعلى',
  sideRight: 'يمين',
  sideBottom: 'أسفل',
  sideLeft: 'يسار',
  sizeTotal: 'الحجم الكلي: \u2066{w} × {h} × {d} mm\u2069',
  sameColors:
    'لون القاعدة والرمز متطابقان — اختر لونين متباينين ليمكن مسح الرمز.',
  ecTitle: 'تصحيح الأخطاء',
  ecL: 'L — منخفض: يستعيد نحو 7% من التلف. أصغر رمز وأبسطه.',
  ecM: 'M — متوسط: يستعيد نحو 15%. خيار افتراضي جيد.',
  ecQ: 'Q — مرتفع: يستعيد نحو 25%. للوحات التي قد تتعرض للخدوش.',
  ecH: 'H — أقصى: يستعيد نحو 30%. الأفضل للاستخدام القاسي، لكن الرمز يصبح أكثر كثافة.',
}

const es: Dict = {
  freeLong: '100 % gratis · sin cuenta · sin créditos',
  freeShort: 'Gratis',
  eyebrow: 'Código QR → modelo 3D imprimible',
  heroTitle: 'Convierte cualquier enlace en una placa QR que puedes {0}.',
  heroHighlight: 'imprimir',
  heroText:
    'Escribe un enlace, un texto o los datos del Wi‑Fi, ajusta la placa y descarga un 3MF de dos colores para tu impresora. Todo funciona en tu navegador: gratis, al instante y sin límites.',
  step1: 'Contenido',
  step2: 'Placa',
  step3: 'Colores de filamento',
  tabLink: 'Enlace',
  tabText: 'Texto',
  tabWifi: 'Wi‑Fi',
  wifiSsid: 'Nombre de la red (SSID)',
  wifiPass: 'Contraseña',
  secOpen: 'Red abierta',
  qrSize: 'Tamaño del QR',
  border: 'Borde (por lado)',
  baseThickness: 'Grosor de la base',
  codeHeight: 'Altura del código',
  cornerRadius: 'Radio de esquinas',
  keychain: 'Argolla para llavero',
  errorCorrection: 'Corrección de errores',
  base: 'Base',
  code: 'Código',
  download3mf: 'Descargar 3MF (2 colores)',
  downloadPngAria: 'Descargar PNG',
  toastTitle: '3MF descargado',
  toastDesc:
    'La base va en el filamento 1 y el código en el filamento 2: ábrelo en tu laminador e imprime.',
  smallModules:
    'Los módulos miden menos de 1 mm: aumenta el tamaño del QR o acorta el contenido para un escaneo fiable.',
  tooLong:
    'El contenido es demasiado largo para un código QR. Prueba a acortarlo.',
  modulesInfo: '{n}×{n} módulos · {mm} mm cada uno',
  tip1Title: 'Un archivo, dos colores',
  tip1Body:
    'El 3MF incluye la base y el código como dos partes de un mismo objeto, ya asignadas al filamento 1 y al filamento 2. Ábrelo en Bambu Studio, Orca o PrusaSlicer e imprime.',
  tip2Title: '¿Impresora de un solo color?',
  tip2Body:
    'Imprime el mismo 3MF con un filamento y añade una pausa en la primera capa del código para cambiar de filamento y lograr contraste al instante.',
  tip3Title: 'Hecho para escanear',
  tip3Body:
    'Mantén los módulos por encima de ~1 mm, usa una base clara con un código oscuro y elige corrección H si la placa va a sufrir rayones.',
  footer:
    '3D QR Generator: una herramienta gratuita y abierta para makers. Los modelos se generan en tu navegador; no se sube nada.',
  install: 'Instalar la app',
  installIos:
    'En iPhone: pulsa Compartir y luego «Añadir a pantalla de inicio».',
  themeToLight: 'Cambiar a modo claro',
  themeToDark: 'Cambiar a modo oscuro',
  language: 'Idioma',
  c0: 'Blanco',
  c1: 'Carbón',
  c2: 'Naranja',
  c3: 'Lima',
  c4: 'Azul',
  c5: 'Rojo',
  c6: 'Amarillo',
  c7: 'Violeta',
  loopGap: 'Distancia del aro',
  loopOffset: 'Posición del aro',
  loopSide: 'Lado del aro',
  sideTop: 'Arriba',
  sideRight: 'Derecha',
  sideBottom: 'Abajo',
  sideLeft: 'Izquierda',
  sizeTotal: 'Tamaño total: {w} × {h} × {d} mm',
  sameColors:
    'La base y el código tienen el mismo color: elige colores con contraste para poder escanear.',
  ecTitle: 'Corrección de errores',
  ecL: 'L — Bajo: recupera ~7 % de daño. El código más pequeño y simple.',
  ecM: 'M — Medio: recupera ~15 %. Buena opción por defecto.',
  ecQ: 'Q — Alto: recupera ~25 %. Para placas que pueden rayarse.',
  ecH: 'H — Máximo: recupera ~30 %. Ideal para uso intenso; el código se vuelve más denso.',
}

const fr: Dict = {
  freeLong: '100 % gratuit · sans compte · sans crédits',
  freeShort: 'Gratuit',
  eyebrow: 'Code QR → modèle 3D imprimable',
  heroTitle:
    'Transformez n’importe quel lien en plaque QR que vous pouvez {0}.',
  heroHighlight: 'imprimer',
  heroText:
    'Saisissez un lien, un texte ou des identifiants Wi‑Fi, réglez la plaque et téléchargez un 3MF bicolore pour votre imprimante. Tout s’exécute dans votre navigateur : gratuit, instantané, illimité.',
  step1: 'Contenu',
  step2: 'Plaque',
  step3: 'Couleurs de filament',
  tabLink: 'Lien',
  tabText: 'Texte',
  tabWifi: 'Wi‑Fi',
  wifiSsid: 'Nom du réseau (SSID)',
  wifiPass: 'Mot de passe',
  secOpen: 'Réseau ouvert',
  qrSize: 'Taille du QR',
  border: 'Bordure (par côté)',
  baseThickness: 'Épaisseur de la base',
  codeHeight: 'Hauteur du code',
  cornerRadius: 'Rayon des coins',
  keychain: 'Anneau porte-clés',
  errorCorrection: 'Correction d’erreurs',
  base: 'Base',
  code: 'Code',
  download3mf: 'Télécharger le 3MF (2 couleurs)',
  downloadPngAria: 'Télécharger le PNG',
  toastTitle: '3MF téléchargé',
  toastDesc:
    'La base utilise le filament 1 et le code le filament 2 — ouvrez-le dans votre trancheur et imprimez.',
  smallModules:
    'Les modules font moins de 1 mm — agrandissez le QR ou raccourcissez le contenu pour un scan fiable.',
  tooLong:
    'Ce contenu est trop long pour un code QR. Essayez de le raccourcir.',
  modulesInfo: '{n}×{n} modules · {mm} mm chacun',
  tip1Title: 'Un fichier, deux couleurs',
  tip1Body:
    'Le 3MF contient la base et le code comme deux parties d’un même objet, déjà affectées au filament 1 et au filament 2. Ouvrez-le dans Bambu Studio, Orca ou PrusaSlicer et imprimez.',
  tip2Title: 'Imprimante monochrome ?',
  tip2Body:
    'Imprimez le même 3MF avec un seul filament, puis ajoutez une pause à la première couche du code pour changer de filament et obtenir un contraste immédiat.',
  tip3Title: 'Conçu pour être scanné',
  tip3Body:
    'Gardez des modules supérieurs à ~1 mm, utilisez une base claire avec un code sombre et choisissez la correction H si votre plaque risque d’être rayée.',
  footer:
    '3D QR Generator — un outil libre et gratuit pour les makers. Les modèles sont générés localement dans votre navigateur ; rien n’est envoyé.',
  install: 'Installer l’appli',
  installIos: 'Sur iPhone : touchez Partager puis « Sur l’écran d’accueil ».',
  themeToLight: 'Passer en mode clair',
  themeToDark: 'Passer en mode sombre',
  language: 'Langue',
  c0: 'Blanc',
  c1: 'Anthracite',
  c2: 'Orange',
  c3: 'Citron vert',
  c4: 'Bleu',
  c5: 'Rouge',
  c6: 'Jaune',
  c7: 'Violet',
  loopGap: 'Distance de l’anneau',
  loopOffset: 'Position de l’anneau',
  loopSide: 'Côté de l’anneau',
  sideTop: 'Haut',
  sideRight: 'Droite',
  sideBottom: 'Bas',
  sideLeft: 'Gauche',
  sizeTotal: 'Taille totale : {w} × {h} × {d} mm',
  sameColors:
    'La base et le code ont la même couleur : choisissez des couleurs contrastées pour pouvoir scanner.',
  ecTitle: 'Correction d’erreurs',
  ecL: 'L — Faible : récupère ~7 % de dégâts. Le code le plus petit et le plus simple.',
  ecM: 'M — Moyen : récupère ~15 %. Bon choix par défaut.',
  ecQ: 'Q — Élevé : récupère ~25 %. Pour les plaques qui peuvent être rayées.',
  ecH: 'H — Maximal : récupère ~30 %. Idéal en usage intensif ; le code devient plus dense.',
}

const de: Dict = {
  freeLong: '100 % kostenlos · ohne Konto · ohne Credits',
  freeShort: 'Gratis',
  eyebrow: 'QR-Code → druckbares 3D-Modell',
  heroTitle: 'Mach aus jedem Link ein QR-Schild zum {0}.',
  heroHighlight: 'Drucken',
  heroText:
    'Gib einen Link, Text oder WLAN-Zugang ein, passe die Platte an und lade eine zweifarbige 3MF-Datei für deinen Drucker herunter. Alles läuft in deinem Browser – kostenlos, sofort, unbegrenzt.',
  step1: 'Inhalt',
  step2: 'Platte',
  step3: 'Filamentfarben',
  tabLink: 'Link',
  tabText: 'Text',
  tabWifi: 'WLAN',
  wifiSsid: 'Netzwerkname (SSID)',
  wifiPass: 'Passwort',
  secOpen: 'Offenes Netzwerk',
  qrSize: 'QR-Größe',
  border: 'Rand (pro Seite)',
  baseThickness: 'Dicke der Basis',
  codeHeight: 'Höhe des Codes',
  cornerRadius: 'Eckenradius',
  keychain: 'Schlüsselanhänger-Öse',
  errorCorrection: 'Fehlerkorrektur',
  base: 'Basis',
  code: 'Code',
  download3mf: '3MF herunterladen (2 Farben)',
  downloadPngAria: 'PNG herunterladen',
  toastTitle: '3MF heruntergeladen',
  toastDesc:
    'Die Basis nutzt Filament 1, der Code Filament 2 – im Slicer öffnen und drucken.',
  smallModules:
    'Die Module sind kleiner als 1 mm – vergrößere den QR-Code oder kürze den Inhalt für sicheres Scannen.',
  tooLong: 'Der Inhalt ist zu lang für einen QR-Code. Versuche ihn zu kürzen.',
  modulesInfo: '{n}×{n} Module · je {mm} mm',
  tip1Title: 'Eine Datei, zwei Farben',
  tip1Body:
    'Die 3MF enthält Basis und Code als zwei Teile eines Objekts, bereits Filament 1 und Filament 2 zugewiesen. Öffne sie in Bambu Studio, Orca oder PrusaSlicer und drucke.',
  tip2Title: 'Drucker mit nur einer Farbe?',
  tip2Body:
    'Drucke dieselbe 3MF mit einem Filament und füge in der ersten Code-Schicht eine Pause ein, um das Filament zu wechseln – für sofortigen Kontrast.',
  tip3Title: 'Gebaut zum Scannen',
  tip3Body:
    'Halte die Module über ca. 1 mm, nimm eine helle Basis mit dunklem Code und wähle Fehlerkorrektur H, wenn das Schild Kratzer abbekommt.',
  footer:
    '3D QR Generator – ein freies, kostenloses Werkzeug für Maker. Modelle entstehen lokal in deinem Browser; nichts wird hochgeladen.',
  install: 'App installieren',
  installIos:
    'Auf dem iPhone: Tippe auf Teilen und dann auf „Zum Home-Bildschirm“.',
  themeToLight: 'Zum hellen Modus wechseln',
  themeToDark: 'Zum dunklen Modus wechseln',
  language: 'Sprache',
  c0: 'Weiß',
  c1: 'Anthrazit',
  c2: 'Orange',
  c3: 'Limette',
  c4: 'Blau',
  c5: 'Rot',
  c6: 'Gelb',
  c7: 'Lila',
  loopGap: 'Abstand der Öse',
  loopOffset: 'Position der Öse',
  loopSide: 'Seite der Öse',
  sideTop: 'Oben',
  sideRight: 'Rechts',
  sideBottom: 'Unten',
  sideLeft: 'Links',
  sizeTotal: 'Gesamtgröße: {w} × {h} × {d} mm',
  sameColors:
    'Basis und Code haben dieselbe Farbe – wähle kontrastreiche Farben, damit sich der Code scannen lässt.',
  ecTitle: 'Fehlerkorrektur',
  ecL: 'L — Niedrig: behebt ~7 % Schaden. Kleinster, einfachster Code.',
  ecM: 'M — Mittel: behebt ~15 %. Gute Standardwahl.',
  ecQ: 'Q — Hoch: behebt ~25 %. Für Schilder, die verkratzen können.',
  ecH: 'H — Maximal: behebt ~30 %. Am besten für raue Nutzung; der Code wird dichter.',
}

const ru: Dict = {
  freeLong: 'Бесплатно · без аккаунта · без кредитов',
  freeShort: 'Бесплатно',
  eyebrow: 'QR-код → 3D-модель для печати',
  heroTitle: 'Превратите любую ссылку в QR-табличку, которую можно {0}.',
  heroHighlight: 'напечатать',
  heroText:
    'Введите ссылку, текст или данные Wi‑Fi, настройте пластину и скачайте двухцветный 3MF для вашего принтера. Всё работает в браузере — бесплатно, мгновенно и без ограничений.',
  step1: 'Содержимое',
  step2: 'Пластина',
  step3: 'Цвета филамента',
  tabLink: 'Ссылка',
  tabText: 'Текст',
  tabWifi: 'Wi‑Fi',
  wifiSsid: 'Имя сети (SSID)',
  wifiPass: 'Пароль',
  secOpen: 'Открытая сеть',
  qrSize: 'Размер QR',
  border: 'Рамка (с каждой стороны)',
  baseThickness: 'Толщина основы',
  codeHeight: 'Высота кода',
  cornerRadius: 'Радиус углов',
  keychain: 'Кольцо для брелока',
  errorCorrection: 'Коррекция ошибок',
  base: 'Основа',
  code: 'Код',
  download3mf: 'Скачать 3MF (2 цвета)',
  downloadPngAria: 'Скачать PNG',
  toastTitle: '3MF скачан',
  toastDesc:
    'Основа — на филаменте 1, код — на филаменте 2. Откройте в слайсере и печатайте.',
  smallModules:
    'Модули меньше 1 мм — увеличьте размер QR или сократите содержимое для надёжного сканирования.',
  tooLong: 'Содержимое слишком длинное для QR-кода. Попробуйте сократить его.',
  modulesInfo: '{n}×{n} модулей · по {mm} mm',
  tip1Title: 'Один файл, два цвета',
  tip1Body:
    'В файле 3MF основа и код — две части одного объекта, уже назначенные на филамент 1 и филамент 2. Откройте его в Bambu Studio, Orca или PrusaSlicer и печатайте.',
  tip2Title: 'Принтер с одним цветом?',
  tip2Body:
    'Напечатайте тот же 3MF одним филаментом и добавьте паузу на первом слое кода, чтобы сменить филамент и получить мгновенный контраст.',
  tip3Title: 'Рассчитано на сканирование',
  tip3Body:
    'Держите модули крупнее ~1 мм, используйте светлую основу с тёмным кодом и выбирайте коррекцию H, если табличка будет царапаться.',
  footer:
    '3D QR Generator — бесплатный открытый инструмент для мейкеров. Модели создаются локально в вашем браузере, ничего не загружается.',
  install: 'Установить приложение',
  installIos: 'На iPhone: нажмите «Поделиться», затем «На экран “Домой”».',
  themeToLight: 'Включить светлую тему',
  themeToDark: 'Включить тёмную тему',
  language: 'Язык',
  c0: 'Белый',
  c1: 'Графитовый',
  c2: 'Оранжевый',
  c3: 'Лаймовый',
  c4: 'Синий',
  c5: 'Красный',
  c6: 'Жёлтый',
  c7: 'Фиолетовый',
  loopGap: 'Расстояние до кольца',
  loopOffset: 'Положение кольца',
  loopSide: 'Сторона кольца',
  sideTop: 'Сверху',
  sideRight: 'Справа',
  sideBottom: 'Снизу',
  sideLeft: 'Слева',
  sizeTotal: 'Общий размер: {w} × {h} × {d} mm',
  sameColors:
    'Основа и код одного цвета — выберите контрастные цвета, чтобы код сканировался.',
  ecTitle: 'Коррекция ошибок',
  ecL: 'L — низкий: восстанавливает ~7% повреждений. Самый маленький и простой код.',
  ecM: 'M — средний: ~15%. Хороший вариант по умолчанию.',
  ecQ: 'Q — повышенный: ~25%. Для табличек, которые могут поцарапаться.',
  ecH: 'H — максимальный: ~30%. Лучше всего для грубого использования, но код становится плотнее.',
}

const dictionaries: Record<Lang, Dict> = { en, he, ar, es, fr, de, ru }

type Vars = Record<string, string | number>

interface I18nValue {
  lang: Lang
  setLang: (l: Lang) => void
  t: (key: Key, vars?: Vars) => string
}

const I18nContext = createContext<I18nValue>({
  lang: 'en',
  setLang: () => {},
  t: (key) => en[key],
})

function isLang(v: unknown): v is Lang {
  return languages.some((l) => l.code === v)
}

// Set when the user picks a language this session (also covers blocked storage).
let chosen: Lang | null = null
const listeners = new Set<() => void>()

/** The language the user picked (this session or saved); English by default. */
function detectLang(): Lang {
  if (chosen) return chosen
  try {
    const stored = localStorage.getItem('lang')
    if (isLang(stored)) return stored
  } catch {
    /* storage unavailable */
  }
  return 'en'
}

function subscribe(onChange: () => void) {
  listeners.add(onChange)
  return () => {
    listeners.delete(onChange)
  }
}

function setLang(l: Lang) {
  chosen = l
  try {
    localStorage.setItem('lang', l)
  } catch {
    /* storage unavailable */
  }
  listeners.forEach((fn) => fn())
}

export function I18nProvider({ children }: { children: React.ReactNode }) {
  // English on the server / during hydration, the real language right after.
  const lang = useSyncExternalStore(subscribe, detectLang, () => 'en' as Lang)

  useLayoutEffect(() => {
    const meta = languages.find((l) => l.code === lang)!
    document.documentElement.lang = lang
    document.documentElement.dir = meta.dir
  }, [lang])

  const value = useMemo<I18nValue>(() => {
    const dict = dictionaries[lang]
    return {
      lang,
      setLang,
      t: (key, vars) => {
        let s = dict[key] ?? en[key]
        if (vars) {
          for (const [k, v] of Object.entries(vars)) {
            s = s.split(`{${k}}`).join(String(v))
          }
        }
        return s
      },
    }
  }, [lang])

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>
}

export const useI18n = () => useContext(I18nContext)
