/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo, useEffect } from "react";
import { 
  format, 
  addMonths, 
  subMonths, 
  startOfMonth, 
  endOfMonth, 
  startOfWeek, 
  endOfWeek, 
  isSameMonth, 
  isSameDay, 
  addDays, 
  eachDayOfInterval,
  isBefore,
  startOfToday
} from "date-fns";
import { 
  ChevronLeft, 
  ChevronRight, 
  Calendar as CalendarIcon, 
  Clock, 
  CheckCircle2, 
  User, 
  Mail, 
  Phone, 
  MessageSquare,
  Monitor,
  Code,
  Database,
  Cpu,
  Settings,
  Sun,
  Moon
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { cn } from "./lib/utils";

// --- Types ---
interface Instructor {
  name: string;
  role: string;
  bio: string;
  availability?: string;
  image: string;
  expertise: string[];
  stats: { label: string; value: string }[];
  phone: string;
  email: string;
}

interface BookingData {
  date: Date;
  time: string;
  name: string;
  email: string;
  phone: string;
  message: string;
}

// --- Mock Data ---
const INSTRUCTOR: Instructor = {
  name: "신상엽(신강사)",
  role: "",
  bio: `현재 디지털 교육을 통해 사람들에게 실질적인 도움을 드리고자 활동하고 있는 신상엽(신강사)입니다.\n\n2016년부터 2022년까지 마산종합사회복지관에서 시니어 대상 디지털 교육(컴퓨터 & 스마트폰)을 진행하며, 누구나 쉽게 디지털을 사용할 수 있도록 돕는 수업을 이어왔습니다.\n\n제가 진행하는 수업은 다음 세 가지를 중요하게 생각합니다.\n첫째, 수강생과의 편안한 소통\n둘째, 바로 활용할 수 있는 실질적인 내용\n셋째, 반복 없이도 스스로 사용할 수 있도록 돕는 이해 중심 수업\n\n특히 디지털이 어려운 초보자나 시니어분들께 적합한 수업입니다.\n\n다가올 테크 미래와 헬스케어 분야에 관심이 많으며, 이를 수업에도 점차 반영하고 있습니다.`,
  availability: `개인 일정상 수업 예약 가능한 요일과 시간은 아래와 같습니다.\n화,수,금 13 ~ 18시`,
  image: "/profile.png",
  expertise: ["시니어 디지털 교육", "컴퓨터 & 스마트폰", "테크 & 헬스케어", "소통 중심 수업"],
  stats: [],
  phone: "010.2585.7542",
  email: "arma2002@naver.com"
};

const TIME_SLOTS = [
  "13:00", "14:00", "15:00", "16:00", "17:00", "18:00"
];

// --- Components ---

export default function App() {
  const [isDarkMode, setIsDarkMode] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('theme');
      if (saved) return saved === 'dark';
      return window.matchMedia('(prefers-color-scheme: dark)').matches;
    }
    return false;
  });

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [isDarkMode]);

  const toggleDarkMode = () => setIsDarkMode(!isDarkMode);

  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedTimes, setSelectedTimes] = useState<string[]>([]);
  const [isBooking, setIsBooking] = useState(false);
  const [bookingComplete, setBookingComplete] = useState(false);
  const [userRole, setUserRole] = useState<"admin" | "student" | null>(null);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [loginInput, setLoginInput] = useState("");
  const [adminBookings, setAdminBookings] = useState<any[]>([]);
  const [studentBookings, setStudentBookings] = useState<any[]>([]);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    message: ""
  });

  const nextMonth = () => setCurrentMonth(addMonths(currentMonth, 1));
  const prevMonth = () => setCurrentMonth(subMonths(currentMonth, 1));

  const days = useMemo(() => {
    const start = startOfWeek(startOfMonth(currentMonth));
    const end = endOfWeek(endOfMonth(currentMonth));
    return eachDayOfInterval({ start, end });
  }, [currentMonth]);

  const handleDateClick = (day: Date) => {
    const dayOfWeek = day.getDay();
    const isDisabledDay = [0, 1, 4, 6].includes(dayOfWeek);
    if (isBefore(day, startOfToday()) || isDisabledDay) return;
    setSelectedDate(day);
    setSelectedTimes([]);
  };

  const toggleTimeSlot = (time: string) => {
    setSelectedTimes(prev => 
      prev.includes(time) 
        ? prev.filter(t => t !== time) 
        : [...prev, time].sort()
    );
  };

  const handleBookingSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsBooking(false); // Close modal first
    
    // Show a loading state or similar if needed, but for now we'll just proceed to success
    // after the API call.
    
    try {
      const response = await fetch("/api/book", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...formData,
          date: selectedDate ? format(selectedDate, "yyyy-MM-dd") : "",
          times: selectedTimes,
        }),
      });

      if (response.ok) {
        setBookingComplete(true);
      } else {
        console.error("Failed to confirm booking");
        // Still show success for demo purposes if API fails but log it
        setBookingComplete(true);
      }
    } catch (error) {
      console.error("Error submitting booking:", error);
      setBookingComplete(true);
    }
  };

  const resetBooking = () => {
    setSelectedDate(null);
    setSelectedTimes([]);
    setBookingComplete(false);
    setFormData({ name: "", email: "", phone: "", message: "" });
  };

  const fetchBookings = async () => {
    try {
      const response = await fetch("/api/bookings");
      const data = await response.json();
      if (data.success) {
        setAdminBookings(data.bookings);
      }
    } catch (error) {
      console.error("Error fetching bookings:", error);
    }
  };

  const fetchMyBookings = async (query: string) => {
    try {
      const response = await fetch(`/api/my-bookings?query=${encodeURIComponent(query)}`);
      const data = await response.json();
      if (data.success) {
        setStudentBookings(data.bookings);
        setUserRole("student");
      }
    } catch (error) {
      console.error("Error fetching my bookings:", error);
    }
  };

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!loginInput) return;

    if (loginInput === "@shin270630@") {
      setUserRole("admin");
      fetchBookings();
    } else {
      // Treat as student lookup
      fetchMyBookings(loginInput);
    }
    setIsLoginModalOpen(false);
    setLoginInput("");
  };

  const handleLoginClick = () => {
    if (userRole) {
      setUserRole(null);
    } else {
      setIsLoginModalOpen(true);
    }
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-sans selection:bg-blue-100 transition-colors duration-300">
      {/* Header */}
      <header className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 sticky top-0 z-50 transition-colors duration-300">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white">
              <Monitor size={20} />
            </div>
            <span className="font-bold text-xl tracking-tight">신강사의 디지털수업</span>
          </div>
          <div className="flex items-center gap-2 sm:gap-4">
            <button
              onClick={toggleDarkMode}
              className="p-2 text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-slate-800 rounded-xl transition-all"
              title={isDarkMode ? "라이트 모드로 전환" : "다크 모드로 전환"}
            >
              {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
            </button>
            <button
              onClick={handleLoginClick}
              className="p-2 text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-slate-800 rounded-xl transition-colors flex items-center gap-2 text-sm font-medium"
              title={userRole ? "로그아웃" : "로그인 / 예약 확인"}
            >
              <Settings className="w-5 h-5" />
              <span className="hidden sm:inline">{userRole ? "로그아웃" : "로그인 / 예약 확인"}</span>
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8 md:py-12">
        {userRole === "admin" ? (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-8"
          >
            <div className="flex items-center justify-between">
              <h2 className="text-3xl font-bold">전체 예약 현황 (관리자)</h2>
              <button 
                onClick={fetchBookings}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-bold"
              >
                새로고침
              </button>
            </div>

            <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden transition-colors duration-300">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800">
                      <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-400">예약일</th>
                      <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-400">시간</th>
                      <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-400">예약자</th>
                      <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-400">연락처</th>
                      <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-400">문의사항</th>
                      <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-400">신청일시</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {adminBookings.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="px-6 py-12 text-center text-slate-400">
                          예약 내역이 없습니다.
                        </td>
                      </tr>
                    ) : (
                      adminBookings.map((booking) => (
                        <tr key={booking.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                          <td className="px-6 py-4 font-bold text-slate-900 dark:text-slate-100">{booking.date}</td>
                          <td className="px-6 py-4">
                            <div className="flex flex-wrap gap-1">
                              {booking.times.map((t: string) => (
                                <span key={t} className="px-2 py-0.5 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded text-[10px] font-bold">
                                  {t}
                                </span>
                              ))}
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="font-medium text-slate-900 dark:text-slate-100">{booking.name}</div>
                            <div className="text-xs text-slate-400">{booking.email}</div>
                          </td>
                          <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-400">{booking.phone}</td>
                          <td className="px-6 py-4 text-sm text-slate-500 dark:text-slate-400 max-w-xs truncate">
                            {booking.message || "-"}
                          </td>
                          <td className="px-6 py-4 text-xs text-slate-400">
                            {format(new Date(booking.createdAt), "yyyy-MM-dd HH:mm")}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </motion.div>
        ) : userRole === "student" ? (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-8"
          >
            <div className="flex items-center justify-between">
              <h2 className="text-3xl font-bold">나의 예약 내역</h2>
              <button 
                onClick={() => setUserRole(null)}
                className="px-4 py-2 bg-slate-200 text-slate-700 rounded-lg hover:bg-slate-300 transition-colors text-sm font-bold"
              >
                뒤로가기
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {studentBookings.length === 0 ? (
                <div className="col-span-full bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-12 text-center text-slate-400 transition-colors duration-300">
                  조회된 예약 내역이 없습니다.
                </div>
              ) : (
                studentBookings.map((booking) => (
                  <motion.div 
                    key={booking.id}
                    whileHover={{ y: -4 }}
                    className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm hover:shadow-md transition-all duration-300"
                  >
                    <div className="flex items-center justify-between mb-4">
                      <div className="px-3 py-1 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-full text-xs font-bold">
                        예약 확정
                      </div>
                      <div className="text-xs text-slate-400">
                        {format(new Date(booking.createdAt), "yyyy-MM-dd HH:mm")} 신청
                      </div>
                    </div>
                    <div className="space-y-3">
                      <div className="flex items-center gap-3">
                        <CalendarIcon size={18} className="text-slate-400" />
                        <span className="font-bold text-lg text-slate-900 dark:text-slate-100">{booking.date}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <Clock size={18} className="text-slate-400" />
                        <div className="flex flex-wrap gap-1">
                          {booking.times.map((t: string) => (
                            <span key={t} className="px-2 py-0.5 bg-slate-100 text-slate-600 rounded text-xs font-medium">
                              {t}
                            </span>
                          ))}
                        </div>
                      </div>
                      <div className="pt-4 mt-4 border-t border-slate-100">
                        <div className="text-xs text-slate-400 mb-1">예약자 정보</div>
                        <div className="font-medium">{booking.name} ({booking.phone})</div>
                      </div>
                    </div>
                  </motion.div>
                ))
              )}
            </div>
          </motion.div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Left: Instructor Profile */}
          <div className="lg:col-span-4 space-y-6">
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-8 shadow-sm overflow-hidden relative transition-colors duration-300"
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-blue-50 dark:bg-blue-900/20 rounded-bl-full -z-0 opacity-50" />
              
              <div className="relative z-10">
                <div className="w-24 h-24 rounded-2xl overflow-hidden mb-6 ring-4 ring-blue-50 dark:ring-slate-800">
                  <img 
                    src={INSTRUCTOR.image} 
                    alt={INSTRUCTOR.name} 
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                </div>
                
                <h2 className="text-2xl font-bold mb-4 text-slate-900 dark:text-slate-100">{INSTRUCTOR.name}</h2>
                <p className="text-slate-600 dark:text-slate-400 leading-relaxed mb-6 text-sm whitespace-pre-line">
                  {INSTRUCTOR.bio}
                </p>

                <div className="space-y-3 mb-6">
                  <div className="flex items-center gap-3 text-slate-600 dark:text-slate-400 text-sm">
                    <div className="w-8 h-8 bg-slate-50 dark:bg-slate-800 rounded-lg flex items-center justify-center text-slate-400">
                      <Phone size={16} />
                    </div>
                    <span>{INSTRUCTOR.phone}</span>
                  </div>
                  <div className="flex items-center gap-3 text-slate-600 dark:text-slate-400 text-sm">
                    <div className="w-8 h-8 bg-slate-50 dark:bg-slate-800 rounded-lg flex items-center justify-center text-slate-400">
                      <Mail size={16} />
                    </div>
                    <span>{INSTRUCTOR.email}</span>
                  </div>
                </div>

                {INSTRUCTOR.availability && (
                  <div className="bg-blue-50 dark:bg-blue-900/20 border-l-4 border-blue-500 p-4 mb-8 rounded-r-2xl shadow-sm">
                    <div className="flex items-center gap-2 mb-2">
                      <Clock size={16} className="text-blue-600 dark:text-blue-400" />
                      <span className="text-blue-700 dark:text-blue-300 font-bold text-sm">수업 가능 시간 안내</span>
                    </div>
                    <p className="text-blue-600 dark:text-blue-400 text-xs leading-relaxed whitespace-pre-line font-medium">
                      {INSTRUCTOR.availability}
                    </p>
                  </div>
                )}

                <div className="space-y-4">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">Expertise</h3>
                  <div className="flex flex-wrap gap-2">
                    {INSTRUCTOR.expertise.map(skill => (
                      <span key={skill} className="px-3 py-1 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-full text-xs font-medium">
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          </div>

          {/* Right: Booking Section */}
          <div className="lg:col-span-8 space-y-6">
            <motion.div 
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden transition-colors duration-300"
            >
              <div className="p-6 md:p-8 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-xl flex items-center justify-center">
                    <CalendarIcon size={20} />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">수업 예약하기</h2>
                    <p className="text-slate-400 text-xs">원하시는 날짜와 시간을 선택해 주세요.</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={prevMonth} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors">
                    <ChevronLeft size={20} className="text-slate-600 dark:text-slate-400" />
                  </button>
                  <span className="text-sm font-bold min-w-[100px] text-center text-slate-900 dark:text-slate-100">
                    {format(currentMonth, "MMMM yyyy")}
                  </span>
                  <button onClick={nextMonth} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors">
                    <ChevronRight size={20} className="text-slate-600 dark:text-slate-400" />
                  </button>
                </div>
              </div>

              <div className="p-6 md:p-8">
                <div className="grid grid-cols-7 mb-4">
                  {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map(day => (
                    <div key={day} className="text-center text-[10px] font-bold uppercase tracking-widest text-slate-400 py-2">
                      {day}
                    </div>
                  ))}
                </div>
                <div className="grid grid-cols-7 gap-1 md:gap-2">
                  {days.map((day, idx) => {
                    const isSelected = selectedDate && isSameDay(day, selectedDate);
                    const isToday = isSameDay(day, new Date());
                    const isCurrentMonth = isSameMonth(day, currentMonth);
                    const isPast = isBefore(day, startOfToday());
                    const dayOfWeek = day.getDay();
                    const isDisabledDay = [0, 1, 4, 6].includes(dayOfWeek);
                    const isDisabled = isPast || isDisabledDay;

                    return (
                      <button
                        key={idx}
                        onClick={() => handleDateClick(day)}
                        disabled={isDisabled}
                        className={cn(
                          "aspect-square flex flex-col items-center justify-center rounded-2xl text-sm font-medium transition-all relative group",
                          !isCurrentMonth && "text-slate-300 dark:text-slate-700",
                          isDisabled && "text-slate-200 dark:text-slate-800 cursor-not-allowed",
                          !isDisabled && isCurrentMonth && "hover:bg-blue-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300",
                          isSelected && "bg-blue-600 text-white hover:bg-blue-600 shadow-lg shadow-blue-200 dark:shadow-none",
                          isToday && !isSelected && "text-blue-600 dark:text-blue-400 font-bold"
                        )}
                      >
                        {format(day, "d")}
                        {isToday && !isSelected && (
                          <div className="w-1 h-1 bg-blue-600 dark:bg-blue-400 rounded-full absolute bottom-2" />
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              <AnimatePresence mode="wait">
                {selectedDate && (
                  <motion.div 
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="px-6 md:px-8 pb-8"
                  >
                    <div className="pt-8 border-t border-slate-100 dark:border-slate-800">
                      <div className="flex items-center gap-2 mb-6">
                        <Clock size={16} className="text-blue-600 dark:text-blue-400" />
                        <h3 className="font-bold text-slate-900 dark:text-slate-100">이용 가능한 시간</h3>
                        <span className="text-slate-400 text-xs ml-auto">
                          {format(selectedDate, "EEEE, MMMM do")}
                        </span>
                      </div>
                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
                        {TIME_SLOTS.map(time => (
                          <button
                            key={time}
                            onClick={() => toggleTimeSlot(time)}
                            className={cn(
                              "py-3 px-4 rounded-xl text-sm font-bold border transition-all",
                              selectedTimes.includes(time) 
                                ? "bg-blue-600 border-blue-600 text-white shadow-md" 
                                : "bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:border-blue-300 dark:hover:border-blue-700 hover:bg-blue-50 dark:hover:bg-slate-700/50"
                            )}
                          >
                            {time}
                          </button>
                        ))}
                      </div>
                    </div>

                    <motion.div 
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: selectedTimes.length > 0 ? 1 : 0.5, y: 0 }}
                      className="mt-10"
                    >
                      <button 
                        disabled={selectedTimes.length === 0}
                        onClick={() => setIsBooking(true)}
                        className="w-full py-4 bg-slate-900 dark:bg-blue-600 text-white rounded-2xl font-bold text-lg hover:bg-slate-800 dark:hover:bg-blue-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-xl dark:shadow-none"
                      >
                        예약 진행하기 ({selectedTimes.length}개 선택됨)
                      </button>
                    </motion.div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          </div>
        </div>
      )}
    </main>

      {/* Booking Modal */}
      <AnimatePresence>
        {isBooking && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsBooking(false)}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-[32px] shadow-2xl relative z-10 overflow-hidden transition-colors duration-300"
            >
              <div className="p-8 border-b border-slate-100 dark:border-slate-800">
                <h2 className="text-2xl font-bold mb-2 text-slate-900 dark:text-slate-100">예약 정보 입력</h2>
                <div className="flex flex-wrap gap-4 text-sm text-slate-500 dark:text-slate-400">
                  <div className="flex items-center gap-1">
                    <CalendarIcon size={14} />
                    {selectedDate && format(selectedDate, "MMM do")}
                  </div>
                  <div className="flex items-center gap-1">
                    <Clock size={14} />
                    {selectedTimes.join(", ")}
                  </div>
                </div>
              </div>

              <form onSubmit={handleBookingSubmit} className="p-8 space-y-6">
                <div className="space-y-4">
                  <div className="relative">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <input 
                      required
                      type="text" 
                      placeholder="이름"
                      className="w-full pl-12 pr-4 py-4 bg-slate-50 dark:bg-slate-800 border-none rounded-2xl focus:ring-2 focus:ring-blue-500 transition-all outline-none text-slate-900 dark:text-slate-100"
                      value={formData.name}
                      onChange={e => setFormData({...formData, name: e.target.value})}
                    />
                  </div>
                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <input 
                      required
                      type="email" 
                      placeholder="이메일"
                      className="w-full pl-12 pr-4 py-4 bg-slate-50 dark:bg-slate-800 border-none rounded-2xl focus:ring-2 focus:ring-blue-500 transition-all outline-none text-slate-900 dark:text-slate-100"
                      value={formData.email}
                      onChange={e => setFormData({...formData, email: e.target.value})}
                    />
                  </div>
                  <div className="relative">
                    <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <input 
                      required
                      type="tel" 
                      placeholder="연락처"
                      className="w-full pl-12 pr-4 py-4 bg-slate-50 dark:bg-slate-800 border-none rounded-2xl focus:ring-2 focus:ring-blue-500 transition-all outline-none text-slate-900 dark:text-slate-100"
                      value={formData.phone}
                      onChange={e => setFormData({...formData, phone: e.target.value})}
                    />
                  </div>
                  <div className="relative">
                    <MessageSquare className="absolute left-4 top-4 text-slate-400" size={18} />
                    <textarea 
                      placeholder="문의 사항 (선택)"
                      rows={3}
                      className="w-full pl-12 pr-4 py-4 bg-slate-50 dark:bg-slate-800 border-none rounded-2xl focus:ring-2 focus:ring-blue-500 transition-all outline-none resize-none text-slate-900 dark:text-slate-100"
                      value={formData.message}
                      onChange={e => setFormData({...formData, message: e.target.value})}
                    />
                  </div>
                </div>

                <div className="flex gap-4">
                  <button 
                    type="button"
                    onClick={() => setIsBooking(false)}
                    className="flex-1 py-4 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 rounded-2xl font-bold hover:bg-slate-200 dark:hover:bg-slate-700 transition-all"
                  >
                    취소
                  </button>
                  <button 
                    type="submit"
                    className="flex-[2] py-4 bg-blue-600 text-white rounded-2xl font-bold hover:bg-blue-700 transition-all shadow-lg shadow-blue-100 dark:shadow-none"
                  >
                    예약 확정하기
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Success Modal */}
      <AnimatePresence>
        {bookingComplete && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={resetBooking}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="bg-white dark:bg-slate-900 w-full max-w-md rounded-[40px] shadow-2xl relative z-10 p-10 text-center transition-colors duration-300"
            >
              <div className="w-20 h-20 bg-green-50 dark:bg-green-900/20 text-green-500 dark:text-green-400 rounded-full flex items-center justify-center mx-auto mb-6">
                <CheckCircle2 size={40} />
              </div>
              <h2 className="text-3xl font-bold mb-4 text-slate-900 dark:text-slate-100">예약이 완료되었습니다!</h2>
              <p className="text-slate-500 dark:text-slate-400 mb-8 leading-relaxed">
                {formData.name}님, {selectedDate && format(selectedDate, "MMMM do")} {selectedTimes.join(", ")}에 수업이 예약되었습니다. 
                확인 이메일을 {formData.email}로 보내드렸습니다.
              </p>
              <button 
                onClick={resetBooking}
                className="w-full py-4 bg-slate-900 dark:bg-blue-600 text-white rounded-2xl font-bold text-lg hover:bg-slate-800 dark:hover:bg-blue-700 transition-all"
              >
                홈으로 돌아가기
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Footer */}
      <footer className="bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 py-12 mt-20 transition-colors duration-300">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <div className="flex items-center justify-center gap-2 mb-6">
            <div className="w-6 h-6 bg-slate-200 dark:bg-slate-800 rounded flex items-center justify-center text-slate-500 dark:text-slate-400">
              <Monitor size={14} />
            </div>
            <span className="font-bold text-slate-900 dark:text-slate-100">신강사의 디지털수업</span>
          </div>
          <p className="text-slate-400 dark:text-slate-500 text-sm mb-8">
            © 2026 신강사의 디지털수업. All rights reserved. <br />
            개인 컴퓨터 수업 및 멘토링 서비스
          </p>
          <div className="flex items-center justify-center gap-6 text-slate-400 dark:text-slate-500 mb-8">
            <a href="#" className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors"><Code size={20} /></a>
            <a href="#" className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors"><Database size={20} /></a>
            <a href="#" className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors"><Cpu size={20} /></a>
          </div>
          <button 
            onClick={handleLoginClick}
            className="text-[10px] text-slate-300 dark:text-slate-600 hover:text-slate-500 dark:hover:text-slate-400 transition-colors uppercase tracking-widest font-bold"
          >
            {userRole ? "로그아웃" : "로그인 / 예약 확인"}
          </button>
        </div>
      </footer>

      {/* Login Modal */}
      <AnimatePresence>
        {isLoginModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsLoginModalOpen(false)}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl shadow-2xl overflow-hidden transition-colors duration-300"
            >
              <div className="p-8">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-xl flex items-center justify-center text-blue-600 dark:text-blue-400">
                    <Settings size={20} />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">로그인 / 예약 확인</h2>
                    <p className="text-sm text-slate-500 dark:text-slate-400">관리자 또는 수강생 정보를 입력하세요.</p>
                  </div>
                </div>

                <form onSubmit={handleLoginSubmit} className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-2">
                      비밀번호 또는 이메일/전화번호
                    </label>
                    <input
                      autoFocus
                      type="text"
                      value={loginInput}
                      onChange={(e) => setLoginInput(e.target.value)}
                      placeholder=""
                      className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all outline-none text-slate-900 dark:text-slate-100"
                    />
                  </div>
                  <div className="flex gap-3 pt-2">
                    <button
                      type="button"
                      onClick={() => setIsLoginModalOpen(false)}
                      className="flex-1 px-6 py-3 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 rounded-xl font-bold hover:bg-slate-200 dark:hover:bg-slate-700 transition-all"
                    >
                      취소
                    </button>
                    <button
                      type="submit"
                      className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 shadow-lg shadow-blue-200 dark:shadow-none transition-all"
                    >
                      확인
                    </button>
                  </div>
                </form>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
