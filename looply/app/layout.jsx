// "use client"

import { Inter } from "next/font/google"
import "./globals.css"
import Sidebar from "@/components/sidebar"
import Header from "@/components/header"
import { ThemeProvider } from "@/components/theme-provider"
import { UserProvider } from "@/context/user-context"
import { LanguageProvider } from "@/context/language-context"

const inter = Inter({ subsets: ["latin"] })

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning={true}>
      <body className={inter.className} suppressHydrationWarning={true}>
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
      generator: 'v0.dev'
    };
