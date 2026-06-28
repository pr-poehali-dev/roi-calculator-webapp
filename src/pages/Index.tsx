import { useEffect, useMemo, useRef, useState } from 'react';
import Icon from '@/components/ui/icon';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { useToast } from '@/hooks/use-toast';

const LEADS_URL = 'https://functions.poehali.dev/b44b1060-b4d0-4ca4-9cee-570fd6ba20b1';

const INDUSTRIES = ['Продажи', 'Логистика', 'Туризм', 'Производство', 'Другое'];
const EMPLOYEE_RANGES = ['1-10', '10-50', '50-200', '200+'];
const EMPLOYEE_MID: Record<string, number> = { '1-10': 5, '10-50': 30, '50-200': 125, '200+': 300 };
const CRM_OPTIONS = ['Да', 'Нет', 'Частично'];

const fmt = (n: number) =>
  new Intl.NumberFormat('ru-RU', { maximumFractionDigits: 0 }).format(Math.round(n));

const useCountUp = (target: number, duration = 1000, active = true) => {
  const [value, setValue] = useState(0);
  const rafRef = useRef<number>();

  useEffect(() => {
    if (!active) return;
    const start = performance.now();
    const from = 0;
    const tick = (now: number) => {
      const progress = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setValue(from + (target - from) * eased);
      if (progress < 1) rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [target, duration, active]);

  return value;
};

const Index = () => {
  const { toast } = useToast();
  const [step, setStep] = useState(1);

  const [industry, setIndustry] = useState('');
  const [employees, setEmployees] = useState('');
  const [salary, setSalary] = useState('');

  const [routineHours, setRoutineHours] = useState(2);
  const [requests, setRequests] = useState('');
  const [crm, setCrm] = useState('');

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  const calc = useMemo(() => {
    const empCount = EMPLOYEE_MID[employees] || 0;
    const sal = Number(salary) || 0;
    const lostHours = routineHours * empCount * 22;
    const lostCost = lostHours * (sal / 160);
    const savings = lostCost * 0.65;
    return { lostHours, lostCost, savings };
  }, [employees, salary, routineHours]);

  const step1Valid = industry && employees && Number(salary) > 0;
  const step2Valid = requests !== '' && crm;

  const submit = async () => {
    if (!name || !phone || !email) {
      toast({ title: 'Заполните все поля', variant: 'destructive' });
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(LEADS_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name, phone, email, industry, employees,
          salary: Number(salary), routineHours,
          savings: Math.round(calc.savings),
        }),
      });
      if (!res.ok) throw new Error();
      setSent(true);
    } catch {
      toast({ title: 'Не удалось отправить заявку', description: 'Попробуйте ещё раз', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background grain relative overflow-hidden">
      <div className="pointer-events-none absolute -top-40 left-1/2 -translate-x-1/2 h-[480px] w-[480px] rounded-full bg-primary/30 blur-[140px] animate-glow" />
      <div className="pointer-events-none absolute bottom-0 right-0 h-[360px] w-[360px] rounded-full bg-primary/20 blur-[120px]" />

      <main className="relative z-10 mx-auto max-w-2xl px-5 py-16 sm:py-24">
        <header className="text-center animate-fade-in">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-border bg-card/60 px-4 py-1.5 text-xs font-medium text-muted-foreground backdrop-blur">
            <span className="h-1.5 w-1.5 rounded-full bg-primary animate-glow" />
            AI-автоматизация бизнеса
          </div>
          <h1 className="text-4xl font-extrabold leading-tight tracking-tight sm:text-5xl">
            Сколько вы теряете без{' '}
            <span className="bg-gradient-to-r from-primary to-violet-400 bg-clip-text text-transparent">
              автоматизации?
            </span>
          </h1>
          <p className="mx-auto mt-4 max-w-md text-base text-muted-foreground sm:text-lg">
            Введите данные — получите расчёт за 30 секунд
          </p>
        </header>

        <div className="mt-12 rounded-3xl border border-border bg-card/70 p-6 shadow-2xl backdrop-blur-xl sm:p-8 animate-scale-in">
          <div className="mb-8 flex items-center gap-3">
            {[1, 2, 3].map((s) => (
              <div key={s} className="flex flex-1 items-center gap-3">
                <div className="flex-1">
                  <div className="h-1.5 w-full overflow-hidden rounded-full bg-secondary">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-primary to-violet-400 transition-all duration-500"
                      style={{ width: step >= s ? '100%' : '0%' }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>

          {step === 1 && (
            <div className="animate-fade-in space-y-6">
              <StepTitle num="01" title="Ваш бизнес" />
              <Field label="Сфера деятельности">
                <Pills options={INDUSTRIES} value={industry} onChange={setIndustry} />
              </Field>
              <Field label="Количество сотрудников">
                <Pills options={EMPLOYEE_RANGES} value={employees} onChange={setEmployees} />
              </Field>
              <Field label="Средняя зарплата сотрудника, ₽/мес">
                <Input
                  type="number"
                  inputMode="numeric"
                  placeholder="80 000"
                  value={salary}
                  onChange={(e) => setSalary(e.target.value)}
                  className="h-12 bg-secondary text-base"
                />
              </Field>
              <Button
                disabled={!step1Valid}
                onClick={() => setStep(2)}
                className="h-12 w-full text-base font-semibold"
              >
                Далее
                <Icon name="ArrowRight" size={18} className="ml-1" />
              </Button>
            </div>
          )}

          {step === 2 && (
            <div className="animate-fade-in space-y-6">
              <StepTitle num="02" title="Рутинные процессы" />
              <Field label={`Часов в день на рутину (на сотрудника): ${routineHours}`}>
                <Slider
                  min={0}
                  max={8}
                  step={0.5}
                  value={[routineHours]}
                  onValueChange={(v) => setRoutineHours(v[0])}
                  className="py-3"
                />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>0 ч</span>
                  <span>8 ч</span>
                </div>
              </Field>
              <Field label="Заявок / документов в месяц">
                <Input
                  type="number"
                  inputMode="numeric"
                  placeholder="500"
                  value={requests}
                  onChange={(e) => setRequests(e.target.value)}
                  className="h-12 bg-secondary text-base"
                />
              </Field>
              <Field label="Есть ли CRM / ERP?">
                <Pills options={CRM_OPTIONS} value={crm} onChange={setCrm} />
              </Field>
              <div className="flex gap-3">
                <Button variant="secondary" onClick={() => setStep(1)} className="h-12 px-5">
                  <Icon name="ArrowLeft" size={18} />
                </Button>
                <Button
                  disabled={!step2Valid}
                  onClick={() => setStep(3)}
                  className="h-12 flex-1 text-base font-semibold"
                >
                  Показать расчёт
                  <Icon name="Sparkles" size={18} className="ml-1" />
                </Button>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="animate-fade-in space-y-6">
              <StepTitle num="03" title="Ваш результат" />

              <div className="grid grid-cols-2 gap-3">
                <Metric
                  icon="Clock"
                  label="Часов теряется в месяц"
                  number={calc.lostHours}
                  suffix=" ч"
                  animate={step === 3}
                />
                <Metric
                  icon="TrendingDown"
                  label="Стоимость потерь"
                  number={calc.lostCost}
                  suffix=" ₽"
                  animate={step === 3}
                />
                <Metric
                  icon="PiggyBank"
                  label="Потенциальная экономия"
                  number={calc.savings}
                  suffix=" ₽"
                  animate={step === 3}
                  highlight
                />
                <Metric icon="Rocket" label="Срок окупаемости" value="2–4 мес." />
              </div>

              {!sent ? (
                <div className="rounded-2xl border border-border bg-secondary/40 p-5">
                  <p className="mb-4 text-sm font-medium text-foreground">
                    Получите персональный план автоматизации
                  </p>
                  <div className="space-y-3">
                    <Input
                      placeholder="Ваше имя"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="h-12 bg-card text-base"
                    />
                    <Input
                      placeholder="Телефон"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="h-12 bg-card text-base"
                    />
                    <Input
                      type="email"
                      placeholder="Email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="h-12 bg-card text-base"
                    />
                    <Button
                      onClick={submit}
                      disabled={loading}
                      className="h-12 w-full text-base font-semibold"
                    >
                      {loading ? 'Отправляем…' : 'Получить план автоматизации'}
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="rounded-2xl border border-primary/40 bg-primary/10 p-6 text-center animate-scale-in">
                  <Icon name="CircleCheck" size={40} className="mx-auto mb-3 text-primary" />
                  <p className="text-lg font-semibold">Заявка принята!</p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Свяжемся с вами в ближайшее время и пришлём план.
                  </p>
                </div>
              )}

              <button
                onClick={() => setStep(1)}
                className="mx-auto flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
              >
                <Icon name="RotateCcw" size={14} />
                Пересчитать заново
              </button>
            </div>
          )}
        </div>

        <p className="mt-8 text-center text-xs text-muted-foreground">
          Расчёт носит ориентировочный характер
        </p>
      </main>
    </div>
  );
};

const StepTitle = ({ num, title }: { num: string; title: string }) => (
  <div className="flex items-center gap-3">
    <span className="text-sm font-bold text-primary">{num}</span>
    <h2 className="text-xl font-bold">{title}</h2>
  </div>
);

const Field = ({ label, children }: { label: string; children: React.ReactNode }) => (
  <div className="space-y-2.5">
    <Label className="text-sm text-muted-foreground">{label}</Label>
    {children}
  </div>
);

const Pills = ({
  options,
  value,
  onChange,
}: {
  options: string[];
  value: string;
  onChange: (v: string) => void;
}) => (
  <div className="flex flex-wrap gap-2">
    {options.map((opt) => (
      <button
        key={opt}
        onClick={() => onChange(opt)}
        className={`rounded-xl border px-4 py-2.5 text-sm font-medium transition-all ${
          value === opt
            ? 'border-primary bg-primary text-primary-foreground'
            : 'border-border bg-secondary text-muted-foreground hover:border-primary/50 hover:text-foreground'
        }`}
      >
        {opt}
      </button>
    ))}
  </div>
);

const Metric = ({
  icon,
  label,
  value,
  number,
  suffix = '',
  animate = false,
  highlight,
}: {
  icon: string;
  label: string;
  value?: string;
  number?: number;
  suffix?: string;
  animate?: boolean;
  highlight?: boolean;
}) => {
  const animated = useCountUp(number ?? 0, 1000, animate && number !== undefined);
  const display = value ?? `${fmt(animated)}${suffix}`;

  return (
    <div
      className={`rounded-2xl border p-4 ${
        highlight
          ? 'border-primary/50 bg-primary/10'
          : 'border-border bg-secondary/40'
      }`}
    >
      <Icon
        name={icon}
        size={20}
        className={highlight ? 'text-primary' : 'text-muted-foreground'}
      />
      <p className="mt-3 text-xs text-muted-foreground">{label}</p>
      <p className={`mt-1 text-lg font-bold tabular-nums ${highlight ? 'text-primary' : 'text-foreground'}`}>
        {display}
      </p>
    </div>
  );
};

export default Index;