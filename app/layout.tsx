import "@/styles/globals.css";
import { Metadata, Viewport } from "next";
import Script from "next/script";
import { NextIntlClientProvider } from "next-intl";
import { getLocale, getMessages } from "next-intl/server";
import clsx from "clsx";

import { Providers } from "./providers";

import { siteConfig } from "@/config/site";
import { fontSans, fontNoto, fontMono } from "@/config/fonts";
import { DemoMode } from "@/components/DemoMode";
import { BgEffect } from "@/components/BgEffect";

export const metadata: Metadata = {
  title: {
    default: siteConfig.name,
    template: `%s - ${siteConfig.name}`,
  },
  description: siteConfig.description,
  icons: {
    icon: "/favicon.ico",
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "white" },
    { media: "(prefers-color-scheme: dark)", color: "black" },
  ],
  width: "device-width",
  height: "device-height",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const locale = await getLocale();
  const messages = await getMessages();
  const gaId = process.env.NEXT_PUBLIC_GA_ID;

  return (
    <html suppressHydrationWarning lang={locale}>
      <head />
      <body
        className={clsx(
          "h-full bg-background font-sans antialiased",
          fontSans.variable,
          fontMono.variable,
          locale.startsWith("zh") ? fontNoto.className : "",
        )}
      >
        <NextIntlClientProvider messages={messages}>
          <Providers
            themeProps={{
              attribute: "class",
              defaultTheme: "system",
              enableSystem: true,
            }}
          >
            <div className="relative flex flex-col h-full">
              <DemoMode />
              <BgEffect />
              <main className="container w-full md:w-4/5 mx-auto max-w-6xl flex-grow z-10">
                {children}
              </main>
            </div>
          </Providers>
        </NextIntlClientProvider>
        {gaId ? (
          <>
            {/* 初始化用 beforeInteractive: App Router 会把它序列化进 self.__next_s,
                在 React 水合之前按序执行完, 保证组件 effect 里 window.gtag 一定已就绪。
                体积只有几百字节, 远端的 gtag.js 仍按 afterInteractive 延后加载。 */}
            <Script
              // eslint-disable-next-line react/no-danger
              dangerouslySetInnerHTML={{
                __html: `window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments)}gtag('js',new Date());gtag('config','${gaId}');`,
              }}
              id="ga-init"
              strategy="beforeInteractive"
            />
            <Script
              id="ga-script"
              src={`https://www.googletagmanager.com/gtag/js?id=${gaId}`}
              strategy="afterInteractive"
            />
          </>
        ) : null}
      </body>
    </html>
  );
}
