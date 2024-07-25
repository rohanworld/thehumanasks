import { Metadata } from "next"
import Image from "next/image"

import { Separator } from '@/components/ui/separator'
import { SidebarNav } from "@/app/settings/components/sidebar-nav"

export const metadata: Metadata = {
  title: "Forms",
  description: "Advanced form example using react-hook-form and Zod.",
}

const sidebarNavItems = [
  {
    title: "Create Question",
    href: "/createQue",
  },
  
]

interface SettingsLayoutProps {
  children: React.ReactNode
}

export default function SettingsLayout({ children }: SettingsLayoutProps) {
  return (
    <>
    <div className="md:container md:max-w-7xl md:mx-auto mt-3">
      
      <div className=" space-y-6 p-10 pb-16  bg-white dark:bg-[#262626] rounded-md font-dmsans">
        <div className="space-y-0.5">
          <h2 className="font-bold tracking-tight font-style-1-headline">Post your Question here</h2>
          <p className="text-muted-foreground font-style-1-subtitle">
            Fill the form to post your Question.
          </p>
        </div>
        <Separator className="my-6" />
        <div className="flex flex-col space-y-8 lg:flex-row lg:space-x-12 lg:space-y-0">
          <aside className="-mx-4 lg:w-1/5 overflow-auto">
            <SidebarNav items={sidebarNavItems} />
          </aside>
          <div className="flex-1 lg:max-w-2xl">{children}</div>
        </div>
      </div>
      </div>
    </>
  )
}