import { useState, useEffect } from 'react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import { Calendar, Clock, BookOpen, AlertCircle, FileText, CheckCircle2, Mic, HelpCircle } from 'lucide-react';
import { driver } from "driver.js";
import "driver.js/dist/driver.css";

// Interfaces matching the desktop app
interface Student {
  id: string;
  name: string;
  academy: string;
  location: string;
  rate: number;
  duration?: string;
  paymentBasis?: string;
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

// Check if text contains Arabic characters
const isArabic = (text: string): boolean => {
  return /[\u0600-\u06FF]/.test(text || '');
};

// Month Names in Arabic
const arabicMonths = [
  'يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو',
  'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'
];

// Demo data for the tour
const demoReport = {
  sectionToggles: { readingNew: true, readingRev: true, homeworkNew: true },
  readingNew: { surah: 'الفاتحة', mode: 'ayah', fromAyah: '١', toAyah: '٧' },
  readingRev: { surah: 'البقرة' },
  homeworkNew: { surah: 'الناس', mode: 'ayah', from: '١', to: '٦' },
  audioLink: 'https://example.com/audio'
};

function App() {
  const [data, setData] = useState<AppState | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isTouring, setIsTouring] = useState(false);

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

  const { students, attendance, month, year, lastReports } = data || {};
  const student = students?.find(s => s.id === studentId);

  useEffect(() => {
    if (student && !loading && !error) {
      const hasSeenTour = localStorage.getItem(`tour_seen_${student.id}`);
      if (!hasSeenTour) {
        setTimeout(() => startTour(), 1000);
      }
    }
  }, [student, loading, error]);

  const startTour = () => {
    const isAr = student ? isArabic(student.name) : true;
    setIsTouring(true);

    const driverObj = driver({
      showProgress: true,
      nextBtnText: isAr ? 'التالي' : 'Next',
      prevBtnText: isAr ? 'السابق' : 'Previous',
      doneBtnText: isAr ? 'إنهاء' : 'Done',
      allowClose: true,
      onDeselected: () => setIsTouring(false),
      onDestroyed: () => {
        setIsTouring(false);
        if (student) localStorage.setItem(`tour_seen_${student.id}`, 'true');
      },
      steps: [
        {
          element: '#student-header',
          popover: {
            title: isAr ? 'مرحباً بك!' : 'Welcome!',
            description: isAr ? 'هنا تجد اسم الطالب والأكاديمية المسجل بها.' : 'Here you can find the student name and the registered academy.',
            side: "bottom", align: 'start'
          }
        },
        {
          element: '#stats-section',
          popover: {
            title: isAr ? 'الإحصائيات' : 'Statistics',
            description: isAr ? 'هنا تظهر عدد الحصص التي حضرها الطالب في الشهر الحالي وتواريخ الحضور.' : 'Here you can see the number of classes attended this month and the attendance dates.',
            side: "bottom", align: 'start'
          }
        },
        {
          element: '#report-section',
          popover: {
            title: isAr ? 'آخر تقرير' : 'Latest Report',
            description: isAr ? 'هذا هو أهم قسم، يحتوي على تفاصيل ما تم إنجازه في آخر حصة والواجب المطلوب.' : 'This is the most important section, containing details of what was achieved in the last class and the required homework.',
            side: "top", align: 'start'
          }
        },
        {
          element: '#audio-link',
          popover: {
            title: isAr ? 'التصحيح الصوتي' : 'Audio Correction',
            description: isAr ? 'في حال وجود ملاحظات صوتية من المعلم، اضغط على هذا الزر للاستماع إليها.' : 'If there are audio notes from the teacher, click this button to listen to them.',
            side: "top", align: 'start'
          }
        },
      ]
    });

    driverObj.drive();
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50" dir="rtl">
        <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-blue-600"></div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 p-6 text-center" dir="rtl">
        <AlertCircle size={64} className="text-red-500 mb-4" />
        <h1 className="text-2xl font-bold text-slate-800 mb-2">عذراً</h1>
        <p className="text-slate-600">{error || 'لم يتم العثور على بيانات'}</p>
      </div>
    );
  }

  if (!student) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 p-6 text-center" dir="rtl">
        <AlertCircle size={64} className="text-amber-500 mb-4" />
        <h1 className="text-2xl font-bold text-slate-800 mb-2">طالب غير موجود</h1>
        <p className="text-slate-600">لا يوجد سجل لهذا الطالب في النظام.</p>
      </div>
    );
  }

  // Calculate stats for current month
  let visitsCount = 0;
  let presentDays: number[] = [];

  if (attendance) {
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
  const studentReport = isTouring ? demoReport : lastReports?.[student.id];

  return (
    <div className="min-h-screen bg-slate-50 font-sans pb-12" dir="rtl">
      {/* Help Button */}
      <button
        onClick={startTour}
        className="fixed bottom-6 left-6 w-12 h-12 bg-white text-blue-600 rounded-full shadow-lg border border-slate-100 flex items-center justify-center z-50 hover:bg-blue-50 transition-colors"
        title="دليل المستخدم"
      >
        <HelpCircle size={28} />
      </button>

      {/* Header */}
      <motion.div
        id="student-header"
        initial={{ y: -50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="bg-blue-600 text-white pt-12 pb-24 px-6 rounded-b-[40px] shadow-lg relative overflow-hidden"
      >
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -mx-20 -my-20"></div>
        <div className="relative z-10 max-w-lg mx-auto text-center">
          <h1 className="text-3xl font-bold mb-2 break-words">{student.name}</h1>
          <p className="text-blue-100/90 text-lg flex items-center justify-center gap-2">
            <BookOpen size={18} /> {student.academy}
          </p>
        </div>
      </motion.div>

      <div className="max-w-lg mx-auto px-4 -mt-16 relative z-20 space-y-6">

        {/* Month & Year Info */}
        <motion.div
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
        <div id="stats-section" className="grid grid-cols-2 gap-4">
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.5 }}
            className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100 text-center"
          >
            <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-3">
              <CheckCircle2 size={24} />
            </div>
            <h3 className="text-3xl font-bold text-slate-800 mb-1">{toHindiDigits(visitsCount)}</h3>
            <p className="text-slate-500 text-sm font-medium">عدد الحصص</p>
          </motion.div>

          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.3, duration: 0.5 }}
            className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100 flex flex-col items-center justify-center"
          >
            <div className="w-12 h-12 bg-purple-50 text-purple-600 rounded-full flex items-center justify-center mx-auto mb-3">
              <Clock size={24} />
            </div>
            <p className="text-slate-500 text-sm font-medium mb-2">أيام الحضور</p>
            <div className="flex flex-wrap justify-center gap-1.5 h-12 overflow-y-auto">
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
        {(studentReport || isTouring) && (
          <motion.div
            id="report-section"
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.4, duration: 0.5 }}
            className="bg-white rounded-3xl p-1 shadow-sm border border-slate-100 overflow-hidden"
          >
            <div className="p-5 border-b border-slate-50 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-amber-50 text-amber-600 rounded-xl flex items-center justify-center">
                  <FileText size={20} />
                </div>
                <h2 className="text-lg font-bold text-slate-800">آخر تقرير (مهام اليوم)</h2>
              </div>

              {/* Audio Link UI */}
              {studentReport?.audioLink && (
                <a
                  id="audio-link"
                  href={studentReport.audioLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-10 h-10 bg-red-50 text-red-600 rounded-full flex items-center justify-center hover:bg-red-100 transition-colors shadow-sm"
                  title="استماع للتصحيح الصوتي"
                >
                  <Mic size={20} />
                </a>
              )}
            </div>

            <div className="p-6 space-y-4">
              <AnimatePresence mode="wait">
                <div className="space-y-4">
                  {/* Reading New */}
                  {(studentReport?.sectionToggles?.readingNew || isTouring) && studentReport?.readingNew && (
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
                  {(studentReport?.sectionToggles?.readingRev || isTouring) && studentReport?.readingRev && (
                    <div className="bg-slate-50 p-4 rounded-2xl">
                      <h3 className="text-emerald-600 font-bold mb-2">🔄 المراجعة</h3>
                      <p className="text-slate-700 text-sm leading-relaxed">
                        سورة {studentReport.readingRev.surah}
                      </p>
                    </div>
                  )}

                  {/* Homework New */}
                  {(studentReport?.sectionToggles?.homeworkNew || isTouring) && studentReport?.homeworkNew && (
                    <div className="bg-orange-50 p-4 rounded-2xl">
                      <h3 className="text-orange-600 font-bold mb-2">📝 واجب (حفظ جديد)</h3>
                      <p className="text-slate-700 text-sm leading-relaxed">
                        سورة {studentReport.homeworkNew.surah}
                        {studentReport.homeworkNew.mode === 'ayah' && studentReport.homeworkNew.from && ` من آية ${toHindiDigits(studentReport.homeworkNew.from)}`}
                        {studentReport.homeworkNew.mode === 'ayah' && studentReport.homeworkNew.to && ` إلى آية ${toHindiDigits(studentReport.homeworkNew.to)}`}
                      </p>
                    </div>
                  )}

                  {!studentReport?.sectionToggles?.readingNew && !studentReport?.sectionToggles?.readingRev && !studentReport?.sectionToggles?.homeworkNew && !isTouring && (
                    <p className="text-center text-slate-500 italic text-sm">لا يتوفر تفاصيل للتقرير الأخير</p>
                  )}
                </div>
              </AnimatePresence>
            </div>
          </motion.div>
        )}

      </div>
    </div>
  );
}

export default App;
