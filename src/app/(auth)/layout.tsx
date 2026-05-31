export const dynamic = 'force-dynamic'

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen grid-bg flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-primary/15 border border-primary/25 mb-4">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" className="text-primary">
              <path d="M12 2C9.23 2 7 4.23 7 7s2.23 5 5 5 5-2.23 5-5-2.23-5-5-5z" fill="currentColor" fillOpacity="0.8"/>
              <path d="M12 14c-5.33 0-8 2.67-8 4v2h16v-2c0-1.33-2.67-4-8-4z" fill="currentColor" fillOpacity="0.4"/>
              <path d="M19 8h-1V7a1 1 0 00-2 0v1h-1a1 1 0 000 2h1v1a1 1 0 002 0V10h1a1 1 0 000-2z" fill="currentColor"/>
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-foreground">PsiOS</h1>
          <p className="text-sm text-muted-foreground mt-1">Sistema de gestão para psicólogos</p>
        </div>
        {children}
      </div>
    </div>
  )
}
