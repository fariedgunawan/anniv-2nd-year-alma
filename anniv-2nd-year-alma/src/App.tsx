import {
  useEffect,
  useState,
  useCallback,
  useRef,
  type KeyboardEvent as ReactKeyboardEvent,
  type ClipboardEvent,
} from "react";
import { AnimatePresence, motion } from "motion/react";

interface StoryPage {
  id: number;
  label: string;
  text: string;
  theme: "dark" | "light";
  isHighlight?: boolean;
}

const CORRECT_PIN = "171124";
const PIN_LENGTH = 6;

const STORY_PAGES: StoryPage[] = [
  {
    id: 1,
    label: "01",
    text: "Halo sayang, gimana? Senang nggak sudah dua tahun bareng aku?",
    theme: "dark",
    isHighlight: true,
  },
  {
    id: 2,
    label: "02",
    text: "Aku mau menyampaikan sesuatu di usia hubungan kita sekarang. Kita sudah melewati banyak fase, dari senang, sedih, sampai marah bareng-bareng.",
    theme: "light",
  },
  {
    id: 3,
    label: "03",
    text: "Aku ingat dulu waktu kamu pertama kali masuk magang, sikapku masih kekanak-kanakan. Aku sering rese dan mengganggu kamu karena waktu itu aku belum punya kegiatan apa-apa. Terima kasih sudah sabar menghadapi aku. Sekarang kita sudah sama-sama punya kesibukan masing-masing, dan aku bangga melihat kita tumbuh sejauh ini.",
    theme: "dark",
  },
  {
    id: 4,
    label: "04",
    text: "Selamat ya, ini hubungan terlamaku dengan seseorang. Tanpa menoleh ke kisah-kisah yang lama, aku senang sekali bisa bertahan selama ini sama kamu. Kita berdua sudah membuktikan apa yang pernah kita ucapkan di awal pacaran.",
    theme: "light",
  },
  {
    id: 5,
    label: "05",
    text: "Terima kasih juga sudah mengenalkan aku lebih dekat dengan keluargamu. Sekarang aku jauh lebih percaya diri datang ke rumah dan bertemu Papah dan Mamah.",
    theme: "dark",
  },
  {
    id: 6,
    label: "06",
    text: "Aku selalu bersyukur ada kamu. Sejak bersamamu, pola pikirku jadi lebih terjaga, dan sikapku kepada orang lain pun terasa lebih baik. Kamu membuat aku jadi versi diriku yang lebih baik.",
    theme: "light",
  },
  {
    id: 7,
    label: "07",
    text: "Aku berharap kita bisa terus bersama sampai waktu yang tepat, dan direstui Allah untuk melangkah ke jenjang yang lebih baik. Semoga ini bukan anniversary terakhir kita. Dari anniversary ini, semoga kita bisa sama-sama lebih terbuka melihat masa depan dan tumbuh menjadi pribadi yang lebih dewasa.",
    theme: "dark",
  },
  {
    id: 8,
    label: "08",
    text: "Sekali lagi, terima kasih ya, sayang, sudah sabar terus menemani aku. Kamu bukan hanya pacarku, tapi juga partner terbaikku, termasuk dalam bekerja.",
    theme: "light",
  },
  {
    id: 9,
    label: "09",
    text: "Aku sayang banget sama kamu, Alma.",
    theme: "dark",
    isHighlight: true,
  },
  {
    id: 10,
    label: "10",
    text: "Dinikmati ya dinnernya…",
    theme: "light",
    isHighlight: true,
  },
];

// Timing constants so typewriter speed & page transition match accurately
const ENTER_DELAY_MS = 650; // Wait for vertical scroll entrance to settle
const CHAR_SPEED_MS = 45; // Typing speed per character
const HOLD_AFTER_TYPING_MS = 1800; // Brief reading pause after last character before scrolling

function getPageTiming(text: string) {
  const typingDurationMs = text.length * CHAR_SPEED_MS;
  const totalDurationMs =
    ENTER_DELAY_MS + typingDurationMs + HOLD_AFTER_TYPING_MS;
  return { typingDurationMs, totalDurationMs };
}

// Vertical scroll transition variants (scroll down effect)
const SCROLL_PAGE_VARIANTS = {
  enter: (direction: number) => ({
    y: direction >= 0 ? "85vh" : "-85vh",
    opacity: 0,
    scale: 0.92,
    filter: "blur(10px)",
  }),
  center: {
    y: 0,
    opacity: 1,
    scale: 1,
    filter: "blur(0px)",
  },
  exit: (direction: number) => ({
    y: direction >= 0 ? "-85vh" : "85vh",
    opacity: 0,
    scale: 0.92,
    filter: "blur(10px)",
  }),
};

export function App() {
  // Authentication / OTP state
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [otp, setOtp] = useState<string[]>(Array(PIN_LENGTH).fill(""));
  const [pinError, setPinError] = useState(false);
  const inputRefs = useRef<Array<HTMLInputElement | null>>([]);

  // Story playback state
  const [currentIndex, setCurrentIndex] = useState(0);
  const [direction, setDirection] = useState(1);
  const [isPaused, setIsPaused] = useState(false);
  const [elapsedMs, setElapsedMs] = useState(0);
  const wheelCooldownRef = useRef(false);

  const currentPage = STORY_PAGES[currentIndex];
  const isLastPage = currentIndex === STORY_PAGES.length - 1;
  const isLight = isUnlocked ? currentPage.theme === "light" : false;
  const { typingDurationMs, totalDurationMs } = getPageTiming(currentPage.text);

  // Focus first OTP input on mount
  useEffect(() => {
    if (!isUnlocked) {
      inputRefs.current[0]?.focus();
    }
  }, [isUnlocked]);

  const verifyOtpCode = useCallback((digits: string[]) => {
    const code = digits.join("");
    if (code.length < PIN_LENGTH) return;

    if (code === CORRECT_PIN) {
      setPinError(false);
      setCurrentIndex(0);
      setDirection(1);
      setElapsedMs(0);
      setIsPaused(false);
      setIsUnlocked(true);
    } else {
      setPinError(true);
      window.setTimeout(() => {
        setOtp(Array(PIN_LENGTH).fill(""));
        setPinError(false);
        inputRefs.current[0]?.focus();
      }, 650);
    }
  }, []);

  const handleOtpChange = (index: number, rawValue: string) => {
    const digit = rawValue.replace(/\D/g, "").slice(-1);
    const nextOtp = [...otp];
    nextOtp[index] = digit;
    setOtp(nextOtp);
    setPinError(false);

    if (digit && index < PIN_LENGTH - 1) {
      inputRefs.current[index + 1]?.focus();
    }

    if (nextOtp.every((d) => d !== "")) {
      verifyOtpCode(nextOtp);
    }
  };

  const handleOtpKeyDown = (
    index: number,
    e: ReactKeyboardEvent<HTMLInputElement>,
  ) => {
    if (e.key === "Backspace") {
      if (otp[index]) {
        const nextOtp = [...otp];
        nextOtp[index] = "";
        setOtp(nextOtp);
      } else if (index > 0) {
        const nextOtp = [...otp];
        nextOtp[index - 1] = "";
        setOtp(nextOtp);
        inputRefs.current[index - 1]?.focus();
      }
    } else if (e.key === "ArrowLeft" && index > 0) {
      inputRefs.current[index - 1]?.focus();
    } else if (e.key === "ArrowRight" && index < PIN_LENGTH - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleOtpPaste = (e: ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pastedDigits = e.clipboardData
      .getData("text")
      .replace(/\D/g, "")
      .slice(0, PIN_LENGTH)
      .split("");

    if (pastedDigits.length === 0) return;

    const nextOtp = Array(PIN_LENGTH)
      .fill("")
      .map((_, i) => pastedDigits[i] ?? "");
    setOtp(nextOtp);

    const focusIdx = Math.min(pastedDigits.length, PIN_LENGTH - 1);
    inputRefs.current[focusIdx]?.focus();

    if (nextOtp.every((d) => d !== "")) {
      verifyOtpCode(nextOtp);
    }
  };

  const goToNext = useCallback(() => {
    if (currentIndex >= STORY_PAGES.length - 1) return;
    setDirection(1);
    setCurrentIndex((prev) => Math.min(prev + 1, STORY_PAGES.length - 1));
    setElapsedMs(0);
  }, [currentIndex]);

  const goToPrev = useCallback(() => {
    if (currentIndex <= 0) return;
    setDirection(-1);
    setCurrentIndex((prev) => Math.max(prev - 1, 0));
    setElapsedMs(0);
  }, [currentIndex]);

  const restartFromFirst = useCallback(() => {
    setDirection(-1);
    setCurrentIndex(0);
    setElapsedMs(0);
    setIsPaused(false);
  }, []);

  const goToPage = useCallback(
    (index: number) => {
      if (index === currentIndex) return;
      setDirection(index > currentIndex ? 1 : -1);
      setCurrentIndex(index);
      setElapsedMs(0);
    },
    [currentIndex],
  );

  // Unified clock that drives both the typewriter characters and the page transition
  useEffect(() => {
    if (!isUnlocked || isPaused) return;
    // Stop ticking once the last page has reached its total duration
    if (isLastPage && elapsedMs >= totalDurationMs) return;

    const tickMs = 30;
    const timer = window.setInterval(() => {
      setElapsedMs((prev) => {
        if (prev + tickMs >= totalDurationMs) {
          return totalDurationMs;
        }
        return prev + tickMs;
      });
    }, tickMs);

    return () => window.clearInterval(timer);
  }, [
    isUnlocked,
    currentIndex,
    isPaused,
    isLastPage,
    elapsedMs,
    totalDurationMs,
  ]);

  // Automatically scroll down to the next page ONLY if not on the last page
  useEffect(() => {
    if (!isUnlocked || isPaused) return;
    if (elapsedMs >= totalDurationMs && !isLastPage) {
      goToNext();
    }
  }, [isUnlocked, elapsedMs, totalDurationMs, isPaused, isLastPage, goToNext]);

  // Keyboard & mouse wheel vertical scroll navigation when unlocked
  useEffect(() => {
    if (!isUnlocked) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowDown" || e.key === "ArrowRight") {
        e.preventDefault();
        if (!isLastPage) goToNext();
      }
      if (e.key === "ArrowUp" || e.key === "ArrowLeft") {
        e.preventDefault();
        if (currentIndex > 0) goToPrev();
      }
      if (e.key === " ") {
        e.preventDefault();
        setIsPaused((prev) => !prev);
      }
    };

    const handleWheel = (e: WheelEvent) => {
      if (wheelCooldownRef.current) return;
      if (Math.abs(e.deltaY) < 25) return;

      if (e.deltaY > 0 && !isLastPage) {
        wheelCooldownRef.current = true;
        goToNext();
      } else if (e.deltaY < 0 && currentIndex > 0) {
        wheelCooldownRef.current = true;
        goToPrev();
      } else {
        return;
      }

      window.setTimeout(() => {
        wheelCooldownRef.current = false;
      }, 900);
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("wheel", handleWheel, { passive: true });
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("wheel", handleWheel);
    };
  }, [isUnlocked, isLastPage, currentIndex, goToNext, goToPrev]);

  // Calculate exact number of typed characters and progress percentage
  const typingElapsed = Math.max(0, elapsedMs - ENTER_DELAY_MS);
  const typedCharCount = Math.min(
    currentPage.text.length,
    Math.floor((typingElapsed / typingDurationMs) * currentPage.text.length),
  );
  const typedText = currentPage.text.slice(0, typedCharCount);
  const isTypingDone = typedCharCount >= currentPage.text.length;
  const progress = Math.min(100, (elapsedMs / totalDurationMs) * 100);
  const isFinishedAtLastPage = isLastPage && elapsedMs >= totalDurationMs;

  return (
    <div
      className={`relative min-h-svh w-full overflow-hidden transition-colors duration-1000 flex flex-col justify-between select-none ${
        isLight ? "bg-white text-black" : "bg-black text-white"
      }`}
    >
      <AnimatePresence mode="wait">
        {!isUnlocked ? (
          /* ================= OTP LOGIN SCREEN ================= */
          <motion.div
            key="otp-login"
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ y: "-85vh", opacity: 0, filter: "blur(10px)" }}
            transition={{ duration: 0.75, ease: [0.16, 1, 0.3, 1] }}
            className="flex min-h-svh w-full flex-col items-center justify-center px-6 text-center"
          >
            <motion.p
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15, duration: 0.5 }}
              className="mb-4 text-[11px] font-medium uppercase tracking-[0.35em] text-white/45"
            >
              2nd Anniversary With Alma
            </motion.p>
            <motion.h1
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.5 }}
              className="font-serif-editorial mb-3 text-3xl sm:text-5xl font-normal italic tracking-wide text-white"
            >
              Masukkan PIN
            </motion.h1>

            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4, duration: 0.5 }}
              className="mb-9 text-xs uppercase tracking-[0.22em] text-white/50"
            >
              6 Digit Tanggal Anniv Kita
            </motion.p>

            {/* 6-Digit OTP Input Boxes */}
            <motion.div
              animate={
                pinError ? { x: [0, -12, 12, -8, 8, -4, 4, 0] } : { x: 0 }
              }
              transition={{ duration: 0.45 }}
              className="flex items-center justify-center gap-2.5 sm:gap-3.5"
            >
              {otp.map((digit, idx) => (
                <input
                  key={idx}
                  ref={(el) => {
                    inputRefs.current[idx] = el;
                  }}
                  type="text"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleOtpChange(idx, e.target.value)}
                  onKeyDown={(e) => handleOtpKeyDown(idx, e)}
                  onPaste={handleOtpPaste}
                  aria-label={`Digit ${idx + 1}`}
                  className={`font-serif-editorial h-14 w-11 sm:h-16 sm:w-13 border bg-transparent text-center text-2xl sm:text-3xl text-white transition-all focus:outline-none ${
                    pinError
                      ? "border-white bg-white/15"
                      : digit
                        ? "border-white"
                        : "border-white/25 focus:border-white"
                  }`}
                />
              ))}
            </motion.div>

            {/* Error or Helper Status */}
            <div className="mt-6 h-5">
              {pinError ? (
                <motion.p
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-[11px] uppercase tracking-[0.25em] text-white/80"
                >
                  PIN belum tepat, coba lagi
                </motion.p>
              ) : (
                <p className="text-[10px] uppercase tracking-[0.25em] text-white/30">
                  Nanti bakal dimulai kalo pin udah bener
                </p>
              )}
            </div>
          </motion.div>
        ) : (
          /* ================= STORY PAGES VIEW ================= */
          <motion.div
            key="story-view"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6 }}
            className="flex min-h-svh w-full flex-col justify-between"
          >
            {/* Top Progress Bar & Minimal Monochrome Header */}
            <header className="relative z-20 mx-auto w-full max-w-3xl px-6 pt-6 sm:px-10 sm:pt-8">
              <div className="flex items-center gap-1.5">
                {STORY_PAGES.map((page, idx) => {
                  const fillWidth =
                    idx < currentIndex
                      ? "100%"
                      : idx === currentIndex
                        ? `${progress}%`
                        : "0%";

                  return (
                    <button
                      key={page.id}
                      type="button"
                      onClick={() => goToPage(idx)}
                      aria-label={`Bagian ${idx + 1}`}
                      className="group relative h-2 flex-1 cursor-pointer py-0.5 focus:outline-none"
                    >
                      <div
                        className={`h-[2px] w-full overflow-hidden transition-all group-hover:h-1 ${
                          isLight ? "bg-black/15" : "bg-white/20"
                        }`}
                      >
                        <div
                          className={`h-full transition-[width] duration-75 ease-linear ${
                            isLight ? "bg-black" : "bg-white"
                          }`}
                          style={{ width: fillWidth }}
                        />
                      </div>
                    </button>
                  );
                })}
              </div>

              <div className="mt-4 flex items-center justify-between text-xs uppercase tracking-[0.22em]">
                <span className={isLight ? "text-black/60" : "text-white/60"}>
                  2nd Anniversary With Alma
                </span>

                {!isFinishedAtLastPage && (
                  <button
                    type="button"
                    onClick={() => setIsPaused((prev) => !prev)}
                    className={`border px-3 py-1 text-[10px] tracking-[0.2em] uppercase transition cursor-pointer ${
                      isLight
                        ? "border-black/25 text-black/80 hover:bg-black hover:text-white"
                        : "border-white/25 text-white/80 hover:bg-white hover:text-black"
                    }`}
                  >
                    {isPaused ? "Lanjut" : "Jeda"}
                  </button>
                )}
              </div>
            </header>

            {/* Vertical Scroll Track Indicator on the Right */}
            <aside className="pointer-events-none fixed right-5 top-1/2 z-20 hidden -translate-y-1/2 flex-col items-center gap-2 sm:flex">
              {STORY_PAGES.map((page, idx) => (
                <button
                  key={page.id}
                  type="button"
                  onClick={() => goToPage(idx)}
                  aria-label={`Halaman ${idx + 1}`}
                  className={`pointer-events-auto w-[2px] transition-all duration-500 cursor-pointer ${
                    idx === currentIndex
                      ? isLight
                        ? "h-7 bg-black"
                        : "h-7 bg-white"
                      : isLight
                        ? "h-2 bg-black/20 hover:bg-black/50"
                        : "h-2 bg-white/20 hover:bg-white/50"
                  }`}
                />
              ))}
            </aside>

            {/* Main Full-Page Vertical Scroll Section */}
            <main className="relative z-10 flex flex-1 items-center justify-center overflow-hidden px-6 py-8 sm:px-12">
              <AnimatePresence mode="wait" custom={direction}>
                <motion.section
                  key={currentPage.id}
                  custom={direction}
                  variants={SCROLL_PAGE_VARIANTS}
                  initial="enter"
                  animate="center"
                  exit="exit"
                  transition={{
                    duration: 0.75,
                    ease: [0.16, 1, 0.3, 1],
                  }}
                  onClick={() => {
                    if (!isFinishedAtLastPage) {
                      setIsPaused((prev) => !prev);
                    }
                  }}
                  className="relative flex w-full max-w-2xl cursor-pointer flex-col items-center text-center"
                >
                  {/* Section Number / Label */}
                  <motion.p
                    initial={{ opacity: 0, y: 14 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1, duration: 0.5 }}
                    className={`mb-6 text-[11px] font-medium uppercase tracking-[0.35em] ${
                      isLight ? "text-black/45" : "text-white/45"
                    }`}
                  >
                    {currentPage.label}
                  </motion.p>

                  {/* Typewriter Paragraph Synchronized with Page Transition */}
                  <p
                    className={`${
                      currentPage.isHighlight
                        ? "font-serif-editorial text-3xl sm:text-5xl font-medium italic leading-snug tracking-wide"
                        : "font-serif-editorial text-2xl sm:text-4xl font-normal leading-relaxed sm:leading-relaxed"
                    } min-h-[4.5rem] text-center`}
                  >
                    <span>{typedText}</span>
                    <motion.span
                      animate={{ opacity: [1, 0, 1] }}
                      transition={{
                        duration: isTypingDone ? 0.9 : 0.5,
                        repeat: Infinity,
                        ease: "linear",
                      }}
                      className={`ml-1 inline-block h-[0.9em] w-[2px] align-baseline ${
                        isLight ? "bg-black" : "bg-white"
                      }`}
                    />
                  </p>

                  {/* Vertical Animated Line Below Text */}
                  <motion.div
                    initial={{ scaleX: 0, opacity: 0 }}
                    animate={{
                      scaleX: isTypingDone ? 1 : 0.35,
                      opacity: isTypingDone ? 1 : 0.25,
                    }}
                    transition={{ duration: 0.5, ease: "easeOut" }}
                    className={`mt-10 h-px w-16 ${
                      isLight ? "bg-black/30" : "bg-white/30"
                    }`}
                  />
                </motion.section>
              </AnimatePresence>
            </main>

            {/* Bottom Scroll Navigation / Stop at End with "Ulangi" Button */}
            <footer className="relative z-20 mx-auto flex w-full max-w-3xl flex-col items-center gap-3 px-6 pb-7 sm:px-10 sm:pb-9">
              {isLastPage ? (
                <motion.div
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5 }}
                  className="flex flex-col items-center gap-3"
                >
                  <button
                    type="button"
                    onClick={restartFromFirst}
                    className={`border px-7 py-2.5 text-xs uppercase tracking-[0.25em] transition cursor-pointer ${
                      isLight
                        ? "border-black bg-black text-white hover:bg-black/80"
                        : "border-white bg-white text-black hover:bg-white/85"
                    }`}
                  >
                    Ulangi
                  </button>
                  <p
                    className={`text-[10px] uppercase tracking-[0.22em] ${
                      isLight ? "text-black/40" : "text-white/40"
                    }`}
                  >
                    Akhir halaman • Klik ulangi untuk kembali ke bagian pertama
                  </p>
                </motion.div>
              ) : (
                <>
                  <div className="flex items-center gap-4">
                    {currentIndex > 0 && (
                      <button
                        type="button"
                        onClick={goToPrev}
                        className={`border px-4 py-2 text-[11px] uppercase tracking-[0.2em] transition cursor-pointer ${
                          isLight
                            ? "border-black/20 text-black/80 hover:border-black hover:bg-black hover:text-white"
                            : "border-white/20 text-white/80 hover:border-white hover:bg-white hover:text-black"
                        }`}
                      >
                        Sebelumnya
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={goToNext}
                      className={`border px-4 py-2 text-[11px] uppercase tracking-[0.2em] transition cursor-pointer ${
                        isLight
                          ? "border-black bg-black text-white hover:bg-black/80"
                          : "border-white bg-white text-black hover:bg-white/85"
                      }`}
                    >
                      Scroll ke Bawah
                    </button>
                  </div>
                </>
              )}
            </footer>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default App;
