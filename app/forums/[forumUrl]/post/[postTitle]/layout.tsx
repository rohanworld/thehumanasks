
import type { Metadata } from "next";

import { cn } from "@/lib/utils";
import Navbar from "@/components/Navbar";
import Providers from "@/components/ThemeProvider";
import { StoreProvider } from "@/store/StoreProvider";
import { Toaster } from "@/components/ui/toaster";

import { GeistSans } from 'geist/font/sans';
import { db } from "@/utils/firebase";
import { collection , getDocs, query, where } from "firebase/firestore";

type Props = {
    params: {
        postTitle: string;
    }
}

type Post = {
    id: string;
    title: string;
    description: string;
    // hashtags: string[];
    keywords: string[];
    answerKeywords: string;
}

export default function ForumPostPage({
  children,
}:{
  children: React.ReactNode;
}) {
  return (
    
            <div className="bg-layout md:container md:max-w-7xl md:mx-auto ">
            <Navbar />
            <div className=" ">
            {children}
            </div>
            </div>
            
  );
}
