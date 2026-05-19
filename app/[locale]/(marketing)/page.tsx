import Link from 'next/link'

type Props = {
  params: { locale: string }
}

export default function LandingPage({ params: { locale } }: Props) {
  return (
    <div className="flex min-h-screen flex-col" dir={locale === 'ar' ? 'rtl' : 'ltr'}>
      <header className="border-b">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4">
          <Link href={`/${locale}`} className="flex items-center gap-2 text-xl font-bold">
            <img src="/logo.svg" alt="CarbControl" className="h-7 w-7" />
            CarbControl
          </Link>
          <nav className="flex items-center gap-4">
            <Link
              href={`/${locale}/login`}
              className="text-sm font-medium text-gray-600 hover:text-gray-900"
            >
              {locale === 'ar' ? 'تسجيل الدخول' : 'Connexion'}
            </Link>
            <Link
              href={`/${locale}/signup`}
              className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
            >
              {locale === 'ar' ? 'ابدأ الآن' : 'Commencer'}
            </Link>
          </nav>
        </div>
      </header>

      <main className="flex-1">
        <HeroSection locale={locale} />
        <FeaturesSection locale={locale} />
        <HowItWorksSection locale={locale} />
        <TestimonialsSection locale={locale} />
      </main>

      <FooterSection locale={locale} />
    </div>
  )
}

function HeroSection({ locale }: { locale: string }) {
  const isAr = locale === 'ar'
  return (
    <section className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 py-24 text-white">
      <div className="mx-auto max-w-5xl px-4 text-center">
        <h1 className="text-4xl font-bold leading-tight md:text-5xl lg:text-6xl">
          {isAr ? 'إدارة أسطولك في الوقت الفعلي' : 'Gérez votre flotte en temps réel'}
        </h1>
        <p className="mx-auto mt-6 max-w-2xl text-lg text-gray-300">
          {isAr
            ? 'منصة متكاملة لتتبع المركبات عبر GPS، مراقبة استهلاك الوقود، وجدولة الصيانة. حلول ذكية لإدارة الأسطول.'
            : 'Plateforme complète de géolocalisation GPS, contrôle du carburant, maintenance et gestion de flotte. Solutions intelligentes pour transporteurs.'}
        </p>
        <div className="mt-10 flex items-center justify-center gap-4">
          <Link
            href={`/${locale}/signup`}
            className="rounded-lg bg-white px-8 py-3 text-lg font-semibold text-slate-900 shadow-lg transition-transform hover:scale-105"
          >
            {isAr ? 'ابدأ الآن' : 'Commencer'}
          </Link>
          <Link
            href={`/${locale}/login`}
            className="rounded-lg border border-white/30 px-8 py-3 text-lg font-semibold text-white transition-colors hover:bg-white/10"
          >
            {isAr ? 'تسجيل الدخول' : 'Connexion'}
          </Link>
        </div>
      </div>
    </section>
  )
}

function FeaturesSection({ locale }: { locale: string }) {
  const isAr = locale === 'ar'
  const features = [
    {
      icon: (
        <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 6.75V15m6-6v8.25m.503 3.498l4.875-2.437c.381-.19.622-.58.622-1.006V4.82c0-.836-.88-1.38-1.628-1.006l-3.869 1.934c-.317.159-.69.159-1.006 0L9.503 3.252a1.125 1.125 0 00-1.006 0L3.622 5.689C3.24 5.88 3 6.27 3 6.695V19.18c0 .836.88 1.38 1.628 1.006l3.869-1.934c.317-.159.69-.159 1.006 0l4.994 2.497c.317.158.69.158 1.006 0z" />
        </svg>
      ),
      title: isAr ? 'تتبع GPS مباشر' : 'Suivi GPS en direct',
      description: isAr
        ? 'تتبع مركباتك في الوقت الفعلي على الخريطة مع تحديثات كل دقيقة.'
        : 'Suivez vos véhicules en temps réel sur une carte avec des mises à jour每分钟.',
    },
    {
      icon: (
        <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 7.5l16.5-4.125M12 6v2.25m8.25 3.75l-16.5 4.125M3.75 16.5l16.5-4.125M3.75 10.5l16.5-4.125M3.75 14.25l16.5-4.125" />
        </svg>
      ),
      title: isAr ? 'مراقبة الوقود' : 'Contrôle du carburant',
      description: isAr
        ? 'كشف التزود بالوقود والاستهلاك غير المصرح به عبر حساسات الوقود الذكية.'
        : 'Détection des pleins et consommations non autorisées via capteurs de carburant.',
    },
    {
      icon: (
        <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M11.42 15.17l-3.94 1.315a.75.75 0 01-.84-.203l-1.536-1.586a.75.75 0 01.143-1.15l3.94-2.013m5.213-2.678l3.94-2.013a.75.75 0 01.84.203l1.536 1.586a.75.75 0 01-.143 1.15l-3.94 2.013M16.5 8.25l-5.25 3L6 5.25" />
        </svg>
      ),
      title: isAr ? 'إدارة الصيانة' : 'Gestion maintenance',
      description: isAr
        ? 'جدولة أعمال الصيانة وتتبع التكاليف وإشعارات الاستحقاق.'
        : 'Planification des maintenances, suivi des coûts et alertes d\'échéance.',
    },
    {
      icon: (
        <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
        </svg>
      ),
      title: isAr ? 'المستندات الرقمية' : 'Documents dématérialisés',
      description: isAr
        ? 'تخزين وإدارة وثائق المركبات والسائقين مع تتبع التواريخ.'
        : 'Stockage et gestion des documents véhicules et chauffeurs avec suivi des dates.',
    },
    {
      icon: (
        <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
        </svg>
      ),
      title: isAr ? 'تنبيهات ذكية' : 'Alertes intelligentes',
      description: isAr
        ? 'إشعارات فورية عند تجاوز السرعة، انخفاض الوقود، أو دخول/خروج من المنطقة.'
        : 'Notifications instantanées pour excès de vitesse, faible carburant, entrée/sortie de zone.',
    },
    {
      icon: (
        <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
        </svg>
      ),
      title: isAr ? 'تقارير PDF' : 'Rapports PDF',
      description: isAr
        ? 'تقارير دورية عن استهلاك الوقود، الصيانة، وأداء السائقين.'
        : 'Rapports périodiques sur consommation, maintenance et performance conducteurs.',
    },
  ]

  return (
    <section className="bg-white py-20">
      <div className="mx-auto max-w-6xl px-4">
        <h2 className="text-center text-3xl font-bold text-gray-900">
          {isAr ? 'مميزات المنصة' : 'Fonctionnalités'}
        </h2>
        <p className="mx-auto mt-3 max-w-xl text-center text-gray-500">
          {isAr
            ? 'كل ما تحتاجه لإدارة أسطولك بكفاءة'
            : 'Tout ce dont vous avez besoin pour gérer votre flotte efficacement'}
        </p>
        <div className="mt-12 grid gap-8 md:grid-cols-2 lg:grid-cols-3">
          {features.map((f, i) => (
            <div
              key={i}
              className="rounded-xl border border-gray-100 bg-white p-6 shadow-sm transition-shadow hover:shadow-md"
            >
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 text-primary">
                {f.icon}
              </div>
              <h3 className="text-lg font-semibold text-gray-900">{f.title}</h3>
              <p className="mt-2 text-sm text-gray-500">{f.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

function HowItWorksSection({ locale }: { locale: string }) {
  const isAr = locale === 'ar'
  const steps = [
    {
      step: '1',
      title: isAr ? 'إنشاء حساب' : 'Créez votre compte',
      description: isAr
        ? 'سجل في دقائق وحدد شركتك. بدون عقود طويلة.'
        : 'Inscrivez-vous en quelques minutes et configurez votre entreprise. Sans engagement.',
    },
    {
      step: '2',
      title: isAr ? 'إضافة المركبات' : 'Ajoutez vos véhicules',
      description: isAr
        ? 'أضف مركباتك مع بياناتها ومستشعرات الوقود.'
        : 'Ajoutez vos véhicules avec leurs données et capteurs carburant.',
    },
    {
      step: '3',
      title: isAr ? 'ربط أجهزة التتبع' : 'Connectez les traceurs',
      description: isAr
        ? 'اربط أجهزة تتبع Wialon وابدأ التتبع الفوري.'
        : 'Connectez vos traceurs Wialon et commencez le suivi en temps réel.',
    },
  ]

  return (
    <section className="bg-gray-50 py-20">
      <div className="mx-auto max-w-5xl px-4">
        <h2 className="text-center text-3xl font-bold text-gray-900">
          {isAr ? 'كيف يعمل' : 'Comment ça marche'}
        </h2>
        <p className="mx-auto mt-3 max-w-xl text-center text-gray-500">
          {isAr
            ? 'ثلاث خطوات بسيطة لبدء تتبع أسطولك'
            : 'Trois étapes simples pour commencer à suivre votre flotte'}
        </p>
        <div className="mt-12 grid gap-8 md:grid-cols-3">
          {steps.map((s, i) => (
            <div key={i} className="text-center">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-primary text-xl font-bold text-primary-foreground">
                {s.step}
              </div>
              <h3 className="mt-4 text-lg font-semibold text-gray-900">{s.title}</h3>
              <p className="mt-2 text-sm text-gray-500">{s.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

function TestimonialsSection({ locale }: { locale: string }) {
  const isAr = locale === 'ar'
  return (
    <section className="bg-white py-20">
      <div className="mx-auto max-w-4xl px-4 text-center">
        <div className="rounded-2xl bg-gray-50 p-8 md:p-12">
          <svg
            className="mx-auto h-8 w-8 text-gray-300"
            fill="currentColor"
            viewBox="0 0 32 32"
          >
            <path d="M10 8c-3.3 0-6 2.7-6 6v8h8v-8H8c0-1.1.9-2 2-2V8zm14 0c-3.3 0-6 2.7-6 6v8h8v-8h-4c0-1.1.9-2 2-2V8z" />
          </svg>
          <p className="mt-4 text-xl italic text-gray-700 md:text-2xl">
            &ldquo;
            {isAr
              ? 'بفضل CarbControl، وفرنا 15% من استهلاك الوقود في الشهر الأول فقط.'
              : 'CarbControl nous a fait économiser 15% de carburant dès le premier mois.'}
            &rdquo;
          </p>
          <p className="mt-4 font-semibold text-gray-900">
            {isAr ? 'ناقل مغربي' : '— Transporteur marocain'}
          </p>
        </div>
      </div>
    </section>
  )
}

function FooterSection({ locale }: { locale: string }) {
  const isAr = locale === 'ar'
  return (
    <footer className="border-t bg-gray-50 py-12">
      <div className="mx-auto max-w-7xl px-4">
        <div className="flex flex-col items-center justify-between gap-4 md:flex-row">
          <div className="flex items-center gap-2 text-lg font-bold text-gray-900">
            <img src="/logo.svg" alt="CarbControl" className="h-6 w-6" />
            CarbControl
          </div>
          <p className="text-sm text-gray-500">
            {isAr ? '© 2024 CarbControl. جميع الحقوق محفوظة.' : '© 2024 CarbControl. Tous droits réservés.'}
          </p>
          <a
            href="mailto:contact@carbcontrol.ma"
            className="text-sm text-gray-500 hover:text-gray-700"
          >
            contact@carbcontrol.ma
          </a>
        </div>
      </div>
    </footer>
  )
}
