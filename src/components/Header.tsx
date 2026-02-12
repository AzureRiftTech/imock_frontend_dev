"use client";

import { useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import Image from "next/image";

const navItems = [
    { label: "Home", href: "/" },
    { label: "Pricing", href: "/pricing" },
    { label: "Blogs", href: "/blogs" },
    { label: "How it Works", href: "/how-it-works" },
    { label: "Help", href: "/help" },
    { label: "Support", href: "/support" },
];

export default function Header() {
    const [open, setOpen] = useState(false);
    const [active, setActive] = useState<"login" | "signup">("login");
    const pathname = usePathname();
    const router = useRouter();

    return (
        <div className="w-full bg-[#F6EEFF] fixed z-10">
            <div className="mx-auto max-w-7xl px-4">
                {/* Top bar */}
                <div className="flex h-16 items-center justify-between">
                    {/* Logo */}
                    <div className="flex items-center gap-2 cursor-pointer" onClick={() => router.push("/")}>
                        <Image
                            src="/imock-logo.svg"
                            alt="robot"
                            width={50}
                            height={50}
                            className=""

                        />
                        <span className="text-2xl font-semibold text-[#9F50E9]">
                            iMock
                        </span>
                    </div>

                    {/* Desktop Nav */}
                    <nav className="hidden md:flex items-center gap-8 text-sm">
                        {navItems.map((item) => {
                            const isActive = pathname === item.href;

                            return (
                                <a
                                    key={item.href}
                                    href={item.href}
                                    className={`relative transition-all
                    ${isActive
                                            ? "font-semibold text-purple-700"
                                            : "text-purple-400 hover:text-purple-700"
                                        }
                  `}
                                >
                                    {item.label}

                                    {/* Active underline */}
                                    {isActive && (
                                        <span className="absolute -bottom-1 left-0 h-[2px] w-full rounded bg-purple-600" />
                                    )}
                                </a>
                            );
                        })}
                    </nav>

                    {/* Desktop Buttons */}
                    <div className="hidden md:flex items-center rounded-full bg-[#e2c5fd] p-1">
                        {/* Login */}
                        <button
                            onClick={() => {
                                setActive("login"),
                                    router.push("/login");
                            }
                            }
                            className={`rounded-full px-5 py-1.5 text-sm transition-all
          ${active === "login"
                                    ? "bg-[#9f50e9] text-white shadow"
                                    : "text-purple-600 "
                                }
        `}
                        >
                            Login
                        </button>

                        {/* Signup */}
                        <button
                            onClick={() => {
                                setActive("signup"),
                                    router.push("/login")
                            }}
                            className={`rounded-full px-5 py-1.5 text-sm transition-all
          ${active === "signup"
                                    ? "bg-[#9f50e9] text-white shadow"
                                    : "text-purple-600 "
                                }
        `}
                        >
                            Sign up
                        </button>
                    </div>

                    {/* Mobile Menu Button */}
                    <button
                        className="md:hidden relative text-2xl text-purple-700"
                        onClick={() => setOpen(!open)}
                    >
                        ☰
                    </button>
                </div>

                {/* Mobile Menu */}
                {open && (
                    <div className="md:hidden pb-4">
                        <nav className="flex flex-col gap-4 text-sm">
                            {navItems.map((item) => {
                                const isActive = pathname === item.href;

                                return (
                                    <a
                                        key={item.href}
                                        href={item.href}
                                        className={`${isActive
                                            ? "font-semibold text-purple-700"
                                            : "text-purple-400"
                                            }`}
                                    >
                                        {item.label}
                                    </a>
                                );
                            })}
                        </nav>

                        <div className="mt-4 flex gap-3">
                            <button className="flex-1 rounded-full border border-purple-500 py-2 text-purple-700">
                                Login
                            </button>
                            <button className="flex-1 rounded-full bg-[#9F50E9] py-2 text-white">
                                Sign up
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div >
    );
}
