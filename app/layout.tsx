import type { ReactNode } from "react";import "./globals.css";
import type { Metadata } from "next";
export const metadata:Metadata={title:{default:"Apex Exotic Rentals",template:"%s | Apex Exotic Rentals"},description:"Premium exotic vehicle rentals with real-time online booking."};
export default function RootLayout({children}:{children:ReactNode}){return <html lang="en"><body>{children}</body></html>}
