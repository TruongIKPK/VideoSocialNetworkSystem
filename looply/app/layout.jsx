// "use client"

import "./globals.css"
import Sidebar from "@/components/sidebar"
import Header from "@/components/header"
import { ThemeProvider } from "@/components/theme-provider"
import { UserProvider } from "@/context/user-context"
import { LanguageProvider } from "@/context/language-context"

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning={true}>
      <body className="font-sans" suppressHydrationWarning={true}>
        <ThemeProvider attribute="class" defaultTheme="light">
          <LanguageProvider>
            <UserProvider>
              <div className="flex min-h-screen">
                <Sidebar />
                <div className="flex-1">
                  <Header />
                  <main className="p-4">{children}</main>
                </div>
              </div>
            </UserProvider>
          </LanguageProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}

export const metadata = {
  title: 'Looply',
  description: 'Looply - Video Social Network',
  icons: {
    icon: '/logo.png',
    shortcut: '/logo.png',
    apple: '/logo.png'
  },
  generator: 'v0.dev'
};
