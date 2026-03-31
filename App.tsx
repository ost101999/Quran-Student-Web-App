import { useState, useEffect } from 'react';
import axios from 'axios';
import { motion } from 'framer-motion';
import { Calendar, Clock, BookOpen, AlertCircle, FileText, CheckCircle2, HelpCircle, Video } from 'lucide-react';
import Joyride, { Step, CallBackProps, STATUS } from 'react-joyride';

// Interfaces matching the desktop app
interface Student {
  id: string;
  name: string;
  academy: string;
  location: string;
  rate: number;
  duration?: string;
  paymentBasis?: string;
  zoomLink?: string;
}

interface AppState {
  students: Student[];
  attendance: Record<string, string>;
  month: number;
  year: number;
  lastReports?: Record<string, any>;
}

// Convert numbers to Arabic Hindi digits
const toHindiDigits = (num: number | string): string => {
  if (num === undefined || num === null) return '';
  return num.toString().replace(/\d/g, (d) => "٠١٢٣٤٥٦٧٨٩"[parseInt(d)]).replace(/\./g, ",");
};

// Month Names in Arabic
const arabicMonths = [
  'يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو',
  'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'
];

function App() {
  const [data, setData] = useState<AppState | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Tour states
  const [runTour, setRunTour] = useState(false);
  const [isTourMode, setIsTourMode] = useState(false);

  // Get student ID from URL
  const searchParams = new URLSearchParams(window.location.search);
  const studentId = searchParams.get('student');

  useEffect(() => {
    const fetchData = async () => {
      if (!studentId) {
        setError('رابط الطالب غير صالح. يرجى التأكد من الرابط.');
        setLoading(false);
        return;
      }

      try {
        const response = await axios.get('https://quran-classes-tracker-default-rtdb.firebaseio.com/appState.json');
        setData(response.data);
      } catch (err) {
        console.error(err);
        setError('حدث خطأ أثناء جلب البيانات. الرجاء المحاولة لاحقاً.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [studentId]);

  // Mock data for Tour
  const mockData: AppState = {
    students: [{
      id: "mock_student",
      name: "أحمد بن عبد الله (حساب افتراضي)",
      academy: "أكاديمية نور القرآن",
      location: "مصر",
      rate: 50
    }],
    attendance: {
      "mock_student_12_5_2024": "1",
      "mock_student_15_5_2024": "1",
      "mock_student_18_5_2024": "1"
    },
    month: 5,
    year: 2024,
    lastReports: {
      "mock_student": {
        sectionToggles: { readingNew: true, readingRev: true, homeworkNew: true },
        readingNew: { surah: "البقرة", mode: "ayah", fromAyah: 1, toAyah: 20 },
        readingRev: { surah: "الفاتحة والناس" },
        homeworkNew: { surah: "آل عمران", mode: "page", from: 50, to: 51 }
      }
    }
  };

  const activeData = isTourMode ? mockData : data;
  const student = isTourMode ? mockData.students[0] : activeData?.students?.find(s => s.id === studentId);

  // Tour Steps
  const tourSteps: Step[] = [
    {
      target: 'body',
      content: 'مرحباً بك في تطبيق متابعة الطلاب! سنأخذك في جولة سريعة للتعرف على الميزات الأساسية للتطبيق.',
      placement: 'center',
      disableBeacon: true,
    },
    {
      target: '#tour-header',
      content: 'هنا تجد البيانات الأساسية للطالب مثل اسمه والأكاديمية التي يدرس بها.',
    },
    {
      target: '#tour-month',
      content: 'يوضح هذا القسم الشهر والسنة الحالية التي تخص إحصائيات الحضور والغياب المعروضة.',
    },
    {
      target: '#tour-stats',
      content: 'من خلال هذا الرقم يمكنك معرفة إجمالي عدد الحصص التي حضرها الطالب بانتظام خلال الشهر المحدد المعروض.',
    },
    {
      target: '#tour-present-days',
      content: 'وهنا يمكنك الاطلاع بدقة على أيام الحضور الفعلية خلال الشهر.',
    },
    {
      target: '#tour-report',
      content: 'أخيراً، يعرض لك هذا القسم التقرير التفصيلي لآخر حصة، ويتضمن المهام المطلوبة من الطالب كالحفظ والمراجعة.',
    }
  ];

  const handleJoyrideCallback = (data: CallBackProps) => {
    const { status } = data;
    if (status === STATUS.FINISHED || status === STATUS.SKIPPED) {
      setRunTour(false);
      setIsTourMode(false);
    }
  };

  const startTour = () => {
    setIsTourMode(true);
    setTimeout(() => {
      setRunTour(true);
    }, 100);
  };

  const FloatingHelpButton = () => (
    <button
      onClick={startTour}
      className="fixed bottom-6 left-6 bg-blue-600 text-white p-3.5 rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.12)] hover:bg-blue-700 hover:-translate-y-1 hover:shadow-[0_8px_30px_rgb(37,99,235,0.4)] transition-all duration-300 z-50 flex items-center justify-center group border border-blue-500/50"
      title="جولة تعريفية"
    >
      <HelpCircle size={28} className="group-hover:rotate-12 transition-transform duration-300 relative z-10" />
      <div className="absolute inset-0 rounded-2xl bg-blue-600 blur-sm opacity-50 group-hover:opacity-100 transition-opacity"></div>
      <div className="absolute inset-0 rounded-2xl bg-gradient-to-tr from-white/0 to-white/20"></div>
    </button>
  );

  // Render loading or error with tour button (unless in tour mode)
  if (!isTourMode) {
    if (loading) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50 relative" dir="rtl">
          <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-blue-600"></div>
          <FloatingHelpButton />
        </div>
      );
    }
    if (error || !activeData) {
      return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 p-6 text-center relative" dir="rtl">
          <AlertCircle size={64} className="text-red-500 mb-4" />
          <h1 className="text-2xl font-bold text-slate-800 mb-2">عذراً</h1>
          <p className="text-slate-600">{error || 'لم يتم العثور على بيانات'}</p>
          <FloatingHelpButton />
        </div>
      );
    }
    if (!student) {
      return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 p-6 text-center relative" dir="rtl">
          <AlertCircle size={64} className="text-amber-500 mb-4" />
          <h1 className="text-2xl font-bold text-slate-800 mb-2">طالب غير موجود</h1>
          <p className="text-slate-600">لا يوجد سجل لهذا الطالب في النظام.</p>
          <FloatingHelpButton />
        </div>
      );
    }
  }

  // Calculate stats for current month
  let visitsCount = 0;
  let presentDays: number[] = [];
  const { attendance, month, year, lastReports } = activeData!;

  if (attendance && student) {
    Object.entries(attendance).forEach(([key, status]) => {
      const parts = key.split('_');
      const id = parts[0];
      const d = parseInt(parts[1]);
      const m = parseInt(parts[2]);
      const y = parseInt(parts[3]);

      if (id === student.id && m === month && y === year) {
        // PRESENT, PAID_ABSENCE, DOUBLE_CLASS
        if (status === '1' || status === '!' || status === '2' || status === 'e' || status === 'ed') {
          visitsCount++;
          if (status === '2' || status === 'ed') visitsCount++; // double
          presentDays.push(d);
        }
      }
    });
  }

  presentDays.sort((a, b) => a - b);
  const studentReport = student ? lastReports?.[student.id] : null;

  const getScheduleLink = (durationStr?: string) => {
    if (!durationStr) return null;
    const normalized = durationStr.toString().replace(/[٠-٩]/g, (d) => "٠١٢٣٤٥٦٧٨٩".indexOf(d).toString()).trim();
    if (normalized === '30') return 'https://zcal.co/i/tYjuo5JV';
    if (normalized === '45') return 'https://zcal.co/i/ThNRhEes';
    if (normalized === '60') return 'https://zcal.co/i/_yKMg4po';
    return null;
  };
  const scheduleLink = getScheduleLink(student?.duration);

  return (
    <div className="min-h-screen bg-slate-50 font-sans pb-12 relative" dir="rtl">

      {/* Joyride Tour Component */}
      <Joyride
        steps={tourSteps}
        run={runTour}
        continuous
        showProgress
        showSkipButton
        callback={handleJoyrideCallback}
        locale={{
          back: 'السابق',
          close: 'إغلاق',
          last: 'إنهاء الجولة',
          next: 'التالي',
          skip: 'تخطي'
        }}
        styles={{
          options: {
            primaryColor: '#2563eb',
            textColor: '#1e293b',
            zIndex: 1000,
            arrowColor: '#fff',
            backgroundColor: '#fff',
            overlayColor: 'rgba(0, 0, 0, 0.5)',
          },
          tooltipContainer: {
            textAlign: 'right',
            direction: 'rtl',
            fontFamily: 'inherit',
          },
          buttonNext: {
            backgroundColor: '#2563eb',
            borderRadius: '8px',
            fontSize: '14px',
            padding: '8px 16px',
            fontFamily: 'inherit',
          },
          buttonBack: {
            marginRight: 0,
            marginLeft: '10px',
            color: '#64748b',
            fontSize: '14px',
            fontFamily: 'inherit',
          },
          buttonSkip: {
            color: '#94a3b8',
            fontSize: '14px',
            fontFamily: 'inherit',
          }
        }}
      />

      <FloatingHelpButton />

      {/* Header */}
      <motion.div
        id="tour-header"
        initial={{ y: -50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="bg-blue-600 text-white pt-12 pb-24 px-6 rounded-b-[40px] shadow-lg relative overflow-hidden"
      >
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -mx-20 -my-20"></div>
        <div className="relative z-10 max-w-lg mx-auto text-center">
          <h1 className="text-3xl font-bold mb-2 break-words">{student?.name}</h1>
          <p className="text-blue-100/90 text-lg flex items-center justify-center gap-2">
            <BookOpen size={18} /> {student?.academy}
          </p>
        </div>
      </motion.div>

      <div className="max-w-lg mx-auto px-4 -mt-16 relative z-20 space-y-6">

        {/* Action Links */}
        {(student?.zoomLink || scheduleLink) && (
          <motion.div
            id="tour-actions"
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.1, duration: 0.5 }}
            className={`grid gap-4 ${student?.zoomLink && scheduleLink ? 'grid-cols-2' : 'grid-cols-1'}`}
          >
            {student?.zoomLink && (
              <a
                href={student.zoomLink}
                target="_blank"
                rel="noopener noreferrer"
                className="bg-white rounded-3xl p-4 shadow-md shadow-blue-500/10 border border-blue-100 flex flex-col items-center justify-center gap-3 hover:bg-blue-50 transition-all group active:scale-95"
              >
                <div className="w-14 h-14 bg-gradient-to-br from-blue-100 to-blue-200 text-blue-600 rounded-2xl flex items-center justify-center group-hover:scale-110 group-hover:rotate-3 transition-transform shadow-sm">
                  <Video size={28} />
                </div>
                <span className="font-bold text-slate-700 text-lg">الالتحاق بالحصة</span>
              </a>
            )}

            {scheduleLink && (
              <a
                href={scheduleLink}
                target="_blank"
                rel="noopener noreferrer"
                className="bg-white rounded-3xl p-4 shadow-md shadow-purple-500/10 border border-purple-100 flex flex-col items-center justify-center gap-3 hover:bg-purple-50 transition-all group active:scale-95"
              >
                <div className="w-14 h-14 bg-gradient-to-br from-purple-100 to-purple-200 text-purple-600 rounded-2xl flex items-center justify-center group-hover:scale-110 group-hover:-rotate-3 transition-transform shadow-sm">
                  <Calendar size={28} />
                </div>
                <span className="font-bold text-slate-700 text-lg">جدولة حصة</span>
              </a>
            )}
          </motion.div>
        )}

        {/* Month & Year Info */}
        <motion.div
          id="tour-month"
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.1, duration: 0.5 }}
          className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100 flex items-center justify-between"
        >
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center">
              <Calendar size={24} />
            </div>
            <div>
              <p className="text-sm text-slate-500 font-medium mb-1">الشهر الحالي</p>
              <p className="text-xl font-bold text-slate-800">{arabicMonths[month]} {toHindiDigits(year)}</p>
            </div>
          </div>
        </motion.div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-4">
          <motion.div
            id="tour-stats"
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.5 }}
            className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100 flex flex-col items-center justify-center text-center h-full"
          >
            <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-3">
              <CheckCircle2 size={24} />
            </div>
            <h3 className="text-3xl font-bold text-slate-800 mb-1">{toHindiDigits(visitsCount)}</h3>
            <p className="text-slate-500 text-sm font-medium">عدد الحصص</p>
          </motion.div>

          {/* Present Days List Mini */}
          <motion.div
            id="tour-present-days"
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.3, duration: 0.5 }}
            className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100 flex flex-col items-center justify-center h-full"
          >
            <div className="w-12 h-12 bg-purple-50 text-purple-600 rounded-full flex items-center justify-center mx-auto mb-3">
              <Clock size={24} />
            </div>
            <p className="text-slate-500 text-sm font-medium mb-2">أيام الحضور</p>
            <div className="flex flex-wrap justify-center gap-1.5 min-h-[3rem]">
              {presentDays.length > 0 ? presentDays.map(d => (
                <span key={d} className="bg-slate-100 text-slate-700 text-xs font-bold px-2 py-1 rounded-md">
                  {toHindiDigits(d)}
                </span>
              )) : (
                <span className="text-slate-400 text-sm">لم يحضر بعد</span>
              )}
            </div>
          </motion.div>
        </div>

        {/* Latest Report Section */}
        {studentReport && (
          <motion.div
            id="tour-report"
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.4, duration: 0.5 }}
            className="bg-white rounded-3xl p-1 shadow-sm border border-slate-100 overflow-hidden"
          >
            <div className="p-5 border-b border-slate-50 flex items-center gap-3">
              <div className="w-10 h-10 bg-amber-50 text-amber-600 rounded-xl flex items-center justify-center">
                <FileText size={20} />
              </div>
              <h2 className="text-lg font-bold text-slate-800">آخر تقرير (مهام اليوم)</h2>
            </div>

            <div className="p-6 space-y-4">
              {/* Reading New */}
              {studentReport.sectionToggles?.readingNew && studentReport.readingNew && (
                <div className="bg-slate-50 p-4 rounded-2xl">
                  <h3 className="text-blue-600 font-bold mb-2">📖 الجديد (تلاوة)</h3>
                  <p className="text-slate-700 text-sm leading-relaxed">
                    سورة {studentReport.readingNew.surah}
                    {studentReport.readingNew.mode === 'ayah' && studentReport.readingNew.fromAyah && ` من آية ${toHindiDigits(studentReport.readingNew.fromAyah)}`}
                    {studentReport.readingNew.mode === 'ayah' && studentReport.readingNew.toAyah && ` إلى آية ${toHindiDigits(studentReport.readingNew.toAyah)}`}
                  </p>
                </div>
              )}

              {/* Reading Revision */}
              {studentReport.sectionToggles?.readingRev && studentReport.readingRev && (
                <div className="bg-slate-50 p-4 rounded-2xl">
                  <h3 className="text-emerald-600 font-bold mb-2">🔄 المراجعة</h3>
                  <p className="text-slate-700 text-sm leading-relaxed">
                    سورة {studentReport.readingRev.surah}
                  </p>
                </div>
              )}

              {/* Homework New */}
              {studentReport.sectionToggles?.homeworkNew && studentReport.homeworkNew && (
                <div className="bg-orange-50 p-4 rounded-2xl">
                  <h3 className="text-orange-600 font-bold mb-2">📝 واجب (حفظ جديد)</h3>
                  <p className="text-slate-700 text-sm leading-relaxed">
                    سورة {studentReport.homeworkNew.surah}
                    {studentReport.homeworkNew.mode === 'ayah' && studentReport.homeworkNew.from && ` من آية ${toHindiDigits(studentReport.homeworkNew.from)}`}
                    {studentReport.homeworkNew.mode === 'ayah' && studentReport.homeworkNew.to && ` إلى آية ${toHindiDigits(studentReport.homeworkNew.to)}`}
                  </p>
                </div>
              )}

              {!studentReport.sectionToggles?.readingNew && !studentReport.sectionToggles?.readingRev && !studentReport.sectionToggles?.homeworkNew && (
                <p className="text-center text-slate-500 italic text-sm">لا يتوفر تفاصيل للتقرير الأخير</p>
              )}
            </div>
          </motion.div>
        )}

      </div>
    </div>
  );
}

export default App;
