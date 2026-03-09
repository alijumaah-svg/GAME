/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  TrendingUp, 
  Clock, 
  Users, 
  DollarSign, 
  Building2, 
  ShoppingBag, 
  Truck, 
  Utensils,
  ChevronRight,
  AlertCircle,
  Trophy,
  RefreshCcw,
  Briefcase
} from 'lucide-react';

// --- Types ---

type GameState = 'START' | 'CHOOSE_PROJECT' | 'PLAYING' | 'EXPANSION' | 'GAME_OVER';

interface Project {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  initialCost: number;
  baseMonthlyIncome: number;
  baseMonthlyExpense: number;
  difficulty: 'Easy' | 'Medium' | 'Hard';
}

interface EventOption {
  text: string;
  consequence: {
    money?: number;
    time?: number;
    reputation?: number;
    marketValue?: number;
    message: string;
  };
}

interface GameEvent {
  id: string;
  title: string;
  description: string;
  options: [EventOption, EventOption];
}

// --- Constants ---

const PROJECTS: Project[] = [
  {
    id: 'burger',
    name: 'مطعم برغر',
    description: 'مشروع تقليدي يعتمد على الجودة والخدمة السريعة. مخاطرة منخفضة ونمو مستقر.',
    icon: <Utensils className="w-8 h-8" />,
    initialCost: 5000,
    baseMonthlyIncome: 2000,
    baseMonthlyExpense: 1200,
    difficulty: 'Easy',
  },
  {
    id: 'ecommerce',
    name: 'متجر إلكتروني',
    description: 'بيع المنتجات عبر الإنترنت. يتطلب تسويقاً قوياً وإدارة مخزون ذكية.',
    icon: <ShoppingBag className="w-8 h-8" />,
    initialCost: 3000,
    baseMonthlyIncome: 2500,
    baseMonthlyExpense: 1800,
    difficulty: 'Medium',
  },
  {
    id: 'delivery',
    name: 'تطبيق توصيل',
    description: 'منصة تقنية تربط المتاجر بالعملاء. نمو سريع جداً لكن بمخاطرة عالية.',
    icon: <Truck className="w-8 h-8" />,
    initialCost: 7000,
    baseMonthlyIncome: 4000,
    baseMonthlyExpense: 3500,
    difficulty: 'Hard',
  },
];

const EVENTS: GameEvent[] = [
  {
    id: 'investor_offer',
    title: 'عرض استثماري',
    description: 'عرض عليك مستثمر 50,000 دولار مقابل 40% من شركتك.',
    options: [
      {
        text: 'أوافق (سيولة عالية، سيطرة أقل)',
        consequence: {
          money: 50000,
          marketValue: 20000,
          reputation: 10,
          message: 'حصلت على السيولة اللازمة، لكنك الآن تشارك القرارات مع المستثمر.'
        }
      },
      {
        text: 'أرفض (استقلالية تامة، سيولة محدودة)',
        consequence: {
          reputation: 5,
          message: 'احتفظت بكامل ملكيتك، المستثمرون يحترمون ثقتك بنفسك.'
        }
      }
    ]
  },
  {
    id: 'talented_employee',
    title: 'موظف موهوب',
    description: 'أحد الموظفين الموهوبين طلب زيادة في الراتب وإلا سيرحل.',
    options: [
      {
        text: 'أعطيه الزيادة (تكلفة أعلى، ولاء أكبر)',
        consequence: {
          money: -2000,
          reputation: 15,
          message: 'بقي الموظف معك وزاد ولاء الفريق بالكامل.'
        }
      },
      {
        text: 'أرفض الزيادة (توفير، خسارة كفاءة)',
        consequence: {
          reputation: -10,
          message: 'رحل الموظف، وتأثرت جودة العمل والروح المعنوية للفريق.'
        }
      }
    ]
  },
  {
    id: 'competitor_prices',
    title: 'المنافس خفض أسعاره',
    description: 'قام منافسك الرئيسي بخفض أسعاره بنسبة 30% لجذب عملائك.',
    options: [
      {
        text: 'أخفض أسعاري أيضاً (حرب أسعار، ربح أقل)',
        consequence: {
          money: -3000,
          reputation: 5,
          message: 'حافظت على عملائك لكن أرباحك تضررت بشكل كبير.'
        }
      },
      {
        text: 'أركز على الجودة (سعر ثابت، قيمة مضافة)',
        consequence: {
          reputation: 15,
          marketValue: 5000,
          message: 'خسرت بعض العملاء الباحثين عن السعر، لكنك بنيت علامة تجارية قوية.'
        }
      }
    ]
  },
  {
    id: 'marketing_campaign',
    title: 'حملة تسويقية كبرى',
    description: 'عرضت عليك وكالة إعلانية حملة ضخمة على وسائل التواصل الاجتماعي.',
    options: [
      {
        text: 'أستثمر في الحملة (تكلفة عالية، انتشار واسع)',
        consequence: {
          money: -5000,
          reputation: 25,
          marketValue: 10000,
          message: 'انتشر اسم شركتك في كل مكان وزادت قيمتها السوقية.'
        }
      },
      {
        text: 'أعتمد على النمو العضوي (توفير، نمو بطيء)',
        consequence: {
          time: -20,
          message: 'وفرت المال، لكن النمو يتطلب وقتاً وجهداً شخصياً أكبر.'
        }
      }
    ]
  },
  {
    id: 'tech_glitch',
    title: 'عطل فني مفاجئ',
    description: 'حدث عطل في نظامك الأساسي أدى لتوقف الخدمة لعدة ساعات.',
    options: [
      {
        text: 'تعويض العملاء المتضررين (تكلفة، استعادة سمعة)',
        consequence: {
          money: -4000,
          reputation: 10,
          message: 'خسرت المال لكنك كسبت ثقة العملاء باحترافيتك.'
        }
      },
      {
        text: 'إصلاح العطل فقط (توفير، غضب العملاء)',
        consequence: {
          reputation: -20,
          marketValue: -3000,
          message: 'وفرت المال لكن السمعة تضررت والعملاء غاضبون.'
        }
      }
    ]
  },
  {
    id: 'new_partnership',
    title: 'شراكة استراتيجية',
    description: 'شركة كبرى تعرض عليك التعاون لتوزيع منتجاتك.',
    options: [
      {
        text: 'أقبل الشراكة (توسع، مشاركة أرباح)',
        consequence: {
          marketValue: 15000,
          reputation: 10,
          money: 2000,
          message: 'فتحت لك الشراكة أبواباً جديدة وزادت قيمة شركتك.'
        }
      },
      {
        text: 'أرفض (استقلالية، نمو ذاتي)',
        consequence: {
          reputation: 5,
          message: 'فضلت الاعتماد على نفسك، وهذا زاد من قوة علامتك التجارية المستقلة.'
        }
      }
    ]
  },
  {
    id: 'tax_audit',
    title: 'تدقيق ضريبي',
    description: 'وصلك إشعار بتدقيق ضريبي مفاجئ لحسابات شركتك.',
    options: [
      {
        text: 'توظيف محاسب خبير (تكلفة، أمان)',
        consequence: {
          money: -3000,
          reputation: 5,
          message: 'مر التدقيق بسلام بفضل المحاسب الخبير.'
        }
      },
      {
        text: 'التعامل مع الأمر بنفسك (توفير، مخاطرة)',
        consequence: {
          money: -8000,
          reputation: -10,
          message: 'وجدت الضرائب بعض الأخطاء وفرضت عليك غرامة كبيرة.'
        }
      }
    ]
  },
  {
    id: 'viral_post',
    title: 'منشور "ترند"',
    description: 'قام أحد المشاهير بنشر صورة لمنتجك وأصبح حديث الساعة.',
    options: [
      {
        text: 'استغلال الفرصة بخصومات (مبيعات، ضغط عمل)',
        consequence: {
          money: 10000,
          time: -40,
          reputation: 20,
          message: 'حققت مبيعات خيالية لكن الفريق منهك تماماً.'
        }
      },
      {
        text: 'الحفاظ على الهدوء (جودة، نمو طبيعي)',
        consequence: {
          reputation: 10,
          marketValue: 5000,
          message: 'حافظت على جودة الخدمة وكسبت احترام العملاء الدائمين.'
        }
      }
    ]
  },
  {
    id: 'office_upgrade',
    title: 'تطوير المقر',
    description: 'هل ترغب في الانتقال إلى مكتب أكبر في منطقة حيوية؟',
    options: [
      {
        text: 'نعم (هيبة، تكلفة ثابتة عالية)',
        consequence: {
          money: -10000,
          reputation: 30,
          marketValue: 15000,
          message: 'المقر الجديد أعطى انطباعاً قوياً للمستثمرين والعملاء.'
        }
      },
      {
        text: 'لا (توفير، بقاء في الظل)',
        consequence: {
          money: 2000,
          message: 'وفرت المال لتطوير المنتج بدلاً من المظاهر.'
        }
      }
    ]
  }
];

// --- Components ---

const StatCard = ({ icon, label, value, color, suffix = "" }: { icon: React.ReactNode, label: string, value: string | number, color: string, suffix?: string }) => (
  <div className={`bg-white border-2 border-black p-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] flex items-center gap-4`}>
    <div className={`p-2 rounded-full ${color} text-white border-2 border-black`}>
      {icon}
    </div>
    <div>
      <p className="text-xs font-bold uppercase tracking-wider text-gray-500">{label}</p>
      <p className="text-xl font-black font-mono">{value}{suffix}</p>
    </div>
  </div>
);

export default function App() {
  const [gameState, setGameState] = useState<GameState>('START');
  const [companyName, setCompanyName] = useState('');
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  
  // Resources
  const [money, setMoney] = useState(10000);
  const [time, setTime] = useState(100);
  const [reputation, setReputation] = useState(50);
  const [month, setMonth] = useState(1);
  const [marketValue, setMarketValue] = useState(10000);
  
  const [currentEvent, setCurrentEvent] = useState<GameEvent | null>(null);
  const [eventMessage, setEventMessage] = useState<string | null>(null);
  const [history, setHistory] = useState<string[]>([]);

  // --- Game Logic ---

  const startGame = () => {
    if (companyName.trim()) {
      setGameState('CHOOSE_PROJECT');
    }
  };

  const selectProject = (project: Project) => {
    setSelectedProject(project);
    setMoney(money - project.initialCost);
    setMarketValue(project.initialCost * 1.5);
    setGameState('PLAYING');
    nextTurn();
  };

  const nextTurn = () => {
    if (month >= 12) {
      setGameState('EXPANSION');
      return;
    }

    if (money <= 0) {
      setGameState('GAME_OVER');
      return;
    }

    // Pick a random event
    const randomEvent = EVENTS[Math.floor(Math.random() * EVENTS.length)];
    setCurrentEvent(randomEvent);
    setEventMessage(null);
  };

  const handleDecision = (option: EventOption) => {
    const { consequence } = option;
    
    setMoney(prev => prev + (consequence.money || 0));
    setTime(prev => Math.max(0, prev + (consequence.time || 0)));
    setReputation(prev => Math.min(100, Math.max(0, prev + (consequence.reputation || 0))));
    setMarketValue(prev => Math.max(0, prev + (consequence.marketValue || 0)));
    
    setEventMessage(consequence.message);
    setHistory(prev => [consequence.message, ...prev].slice(0, 5));

    // End of month calculations
    if (selectedProject) {
      const monthlyProfit = selectedProject.baseMonthlyIncome - selectedProject.baseMonthlyExpense;
      const reputationBonus = (reputation / 50) * 500;
      setMoney(prev => prev + monthlyProfit + reputationBonus);
      setMarketValue(prev => prev + (monthlyProfit * 2) + (reputation * 100));
    }

    // Move to next month after a short delay
    setTimeout(() => {
      setMonth(prev => prev + 1);
      setTime(100); // Reset time for new month
      nextTurn();
    }, 2500);
  };

  const resetGame = () => {
    setGameState('START');
    setCompanyName('');
    setSelectedProject(null);
    setMoney(10000);
    setTime(100);
    setReputation(50);
    setMonth(1);
    setMarketValue(10000);
    setHistory([]);
  };

  // --- Renderers ---

  const renderStart = () => (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-md w-full bg-white border-4 border-black p-8 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]"
    >
      <div className="flex justify-center mb-6">
        <div className="bg-yellow-400 p-4 border-4 border-black rounded-2xl rotate-3">
          <TrendingUp className="w-12 h-12 text-black" />
        </div>
      </div>
      <h1 className="text-4xl font-black text-center mb-2 uppercase tracking-tighter">رائد أعمال</h1>
      <p className="text-center text-gray-600 mb-8 font-bold">الطريق إلى النجاح</p>
      
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-black uppercase mb-2">اسم الشركة</label>
          <input 
            type="text" 
            value={companyName}
            onChange={(e) => setCompanyName(e.target.value)}
            placeholder="مثلاً: شركة الصقر"
            className="w-full p-4 border-4 border-black font-bold focus:outline-none focus:bg-yellow-50"
          />
        </div>
        <button 
          onClick={startGame}
          disabled={!companyName.trim()}
          className="w-full bg-black text-white p-4 font-black uppercase tracking-widest hover:bg-gray-800 disabled:bg-gray-400 flex items-center justify-center gap-2 transition-transform active:scale-95"
        >
          ابدأ الرحلة <ChevronRight className="w-5 h-5" />
        </button>
      </div>
    </motion.div>
  );

  const renderChooseProject = () => (
    <div className="max-w-4xl w-full">
      <h2 className="text-3xl font-black mb-8 text-center uppercase tracking-tighter bg-white inline-block px-4 py-2 border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] mx-auto block w-fit">اختر فكرة مشروعك</h2>
      <div className="grid md:grid-cols-3 gap-6">
        {PROJECTS.map((project) => (
          <motion.div 
            key={project.id}
            whileHover={{ y: -5 }}
            className="bg-white border-4 border-black p-6 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] flex flex-col"
          >
            <div className="bg-blue-500 text-white p-3 border-2 border-black rounded-xl w-fit mb-4">
              {project.icon}
            </div>
            <h3 className="text-xl font-black mb-2">{project.name}</h3>
            <p className="text-sm text-gray-600 mb-6 font-bold flex-grow">{project.description}</p>
            <div className="space-y-2 mb-6 text-sm font-mono font-bold">
              <div className="flex justify-between">
                <span>التكلفة:</span>
                <span className="text-red-600">${project.initialCost.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span>الصعوبة:</span>
                <span className={project.difficulty === 'Easy' ? 'text-green-600' : project.difficulty === 'Medium' ? 'text-yellow-600' : 'text-red-600'}>
                  {project.difficulty}
                </span>
              </div>
            </div>
            <button 
              onClick={() => selectProject(project)}
              className="w-full bg-black text-white p-3 font-black uppercase hover:bg-blue-600 transition-colors border-2 border-black"
            >
              اختر هذا المشروع
            </button>
          </motion.div>
        ))}
      </div>
    </div>
  );

  const renderPlaying = () => (
    <div className="max-w-6xl w-full grid grid-cols-1 lg:grid-cols-3 gap-8">
      {/* Sidebar: Stats */}
      <div className="space-y-4">
        <div className="bg-black text-white p-4 border-4 border-black shadow-[4px_4px_0px_0px_rgba(255,255,255,0.2)]">
          <h2 className="text-2xl font-black truncate">{companyName}</h2>
          <p className="text-xs font-bold opacity-70 uppercase">{selectedProject?.name}</p>
        </div>
        
        <div className="grid grid-cols-1 gap-4">
          <StatCard icon={<DollarSign />} label="الميزانية" value={money.toLocaleString()} color="bg-green-500" suffix="$" />
          <StatCard icon={<TrendingUp />} label="القيمة السوقية" value={marketValue.toLocaleString()} color="bg-blue-500" suffix="$" />
          <StatCard icon={<Users />} label="السمعة" value={reputation} color="bg-purple-500" suffix="%" />
          <StatCard icon={<Clock />} label="الشهر" value={month} color="bg-orange-500" suffix=" / 12" />
        </div>

        <div className="bg-white border-2 border-black p-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
          <h3 className="text-sm font-black uppercase mb-3 border-b-2 border-black pb-1">آخر الأحداث</h3>
          <div className="space-y-2">
            {history.length === 0 && <p className="text-xs text-gray-400 italic">لا توجد أحداث بعد...</p>}
            {history.map((msg, i) => (
              <p key={i} className="text-xs font-bold text-gray-600 leading-tight border-l-2 border-gray-200 pl-2">
                {msg}
              </p>
            ))}
          </div>
        </div>
      </div>

      {/* Main Area: Event Card */}
      <div className="lg:col-span-2">
        <AnimatePresence mode="wait">
          {eventMessage ? (
            <motion.div 
              key="message"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.1 }}
              className="bg-yellow-100 border-4 border-black p-12 shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] h-full flex flex-col items-center justify-center text-center"
            >
              <div className="bg-white p-4 border-4 border-black rounded-full mb-6">
                <AlertCircle className="w-12 h-12 text-black" />
              </div>
              <h3 className="text-3xl font-black mb-4">النتيجة</h3>
              <p className="text-xl font-bold mb-8 max-w-md">{eventMessage}</p>
              <div className="w-16 h-2 bg-black animate-pulse"></div>
              <p className="mt-4 text-sm font-black uppercase tracking-widest text-gray-500">جاري الانتقال للشهر التالي...</p>
            </motion.div>
          ) : currentEvent ? (
            <motion.div 
              key={currentEvent.id}
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -50 }}
              className="bg-white border-4 border-black p-8 shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] h-full flex flex-col"
            >
              <div className="flex items-center gap-3 mb-6">
                <div className="bg-black text-white px-3 py-1 text-xs font-black uppercase tracking-tighter">حدث الشهر {month}</div>
                <div className="h-px flex-grow bg-black"></div>
              </div>
              
              <h3 className="text-4xl font-black mb-6 leading-tight">{currentEvent.title}</h3>
              <p className="text-xl font-bold text-gray-700 mb-12 leading-relaxed">{currentEvent.description}</p>
              
              <div className="mt-auto grid grid-cols-1 md:grid-cols-2 gap-4">
                {currentEvent.options.map((option, idx) => (
                  <button 
                    key={idx}
                    onClick={() => handleDecision(option)}
                    className="group relative bg-white border-4 border-black p-6 text-right hover:bg-black hover:text-white transition-all duration-200"
                  >
                    <div className="flex items-start gap-4">
                      <div className="bg-black text-white w-8 h-8 flex items-center justify-center font-black group-hover:bg-white group-hover:text-black border-2 border-black shrink-0">
                        {idx === 0 ? 'أ' : 'ب'}
                      </div>
                      <span className="text-lg font-black leading-tight">{option.text}</span>
                    </div>
                  </button>
                ))}
              </div>
            </motion.div>
          ) : null}
        </AnimatePresence>
      </div>
    </div>
  );

  const renderGameOver = () => (
    <motion.div 
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className="max-w-md w-full bg-red-50 border-4 border-black p-8 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] text-center"
    >
      <div className="bg-red-500 text-white p-4 border-4 border-black rounded-full inline-block mb-6">
        <AlertCircle className="w-12 h-12" />
      </div>
      <h2 className="text-4xl font-black mb-4 uppercase">إفلاس!</h2>
      <p className="text-lg font-bold mb-8">لقد نفدت أموالك ولم تعد الشركة قادرة على الاستمرار. ريادة الأعمال صعبة، لكن الفشل هو أول خطوة للتعلم.</p>
      <button 
        onClick={resetGame}
        className="w-full bg-black text-white p-4 font-black uppercase tracking-widest hover:bg-gray-800 flex items-center justify-center gap-2"
      >
        <RefreshCcw className="w-5 h-5" /> حاول مرة أخرى
      </button>
    </motion.div>
  );

  const renderExpansion = () => (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-2xl w-full bg-green-50 border-4 border-black p-12 shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] text-center"
    >
      <div className="bg-yellow-400 p-6 border-4 border-black rounded-full inline-block mb-8 rotate-12">
        <Trophy className="w-16 h-16 text-black" />
      </div>
      <h2 className="text-5xl font-black mb-4 uppercase tracking-tighter">لقد نجحت!</h2>
      <p className="text-xl font-bold mb-8 italic text-gray-600">بعد 12 شهراً من الكفاح، أصبحت "{companyName}" شركة حقيقية في السوق.</p>
      
      <div className="grid grid-cols-2 gap-4 mb-12">
        <div className="bg-white border-2 border-black p-4">
          <p className="text-xs font-black text-gray-500 uppercase">الرصيد النهائي</p>
          <p className="text-2xl font-black">${money.toLocaleString()}</p>
        </div>
        <div className="bg-white border-2 border-black p-4">
          <p className="text-xs font-black text-gray-500 uppercase">القيمة السوقية</p>
          <p className="text-2xl font-black">${marketValue.toLocaleString()}</p>
        </div>
      </div>

      <div className="space-y-4">
        <h3 className="text-2xl font-black mb-4">ما هي خطوتك القادمة؟</h3>
        <div className="grid grid-cols-1 gap-4">
          <button onClick={resetGame} className="bg-black text-white p-4 font-black uppercase hover:bg-blue-600 border-2 border-black">بيع الشركة والتقاعد</button>
          <button onClick={resetGame} className="bg-white text-black p-4 font-black uppercase hover:bg-yellow-400 border-4 border-black">التوسع عالمياً</button>
        </div>
      </div>
    </motion.div>
  );

  return (
    <div className="min-h-screen bg-[#E4E3E0] text-black font-sans selection:bg-yellow-300 p-4 md:p-8 flex items-center justify-center dir-rtl" dir="rtl">
      {/* Background Grid Pattern */}
      <div className="fixed inset-0 pointer-events-none opacity-5" style={{ backgroundImage: 'radial-gradient(#000 1px, transparent 1px)', backgroundSize: '20px 20px' }}></div>
      
      <div className="relative z-10 w-full flex justify-center">
        {gameState === 'START' && renderStart()}
        {gameState === 'CHOOSE_PROJECT' && renderChooseProject()}
        {gameState === 'PLAYING' && renderPlaying()}
        {gameState === 'GAME_OVER' && renderGameOver()}
        {gameState === 'EXPANSION' && renderExpansion()}
      </div>

      {/* Footer Decoration */}
      <div className="fixed bottom-4 right-4 text-[10px] font-black uppercase tracking-widest opacity-30 flex items-center gap-2">
        <Briefcase className="w-3 h-3" /> Entrepreneur Simulator v1.0
      </div>
    </div>
  );
}
