
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

const fetchPost = async (postTitle: string) => {
    
    //how to fetch the question from the firestore using postTitle
    const queRef = collection(db, "questions");
    const q = query (queRef, where("title", "==", postTitle));

    const querySnapshot = await getDocs(q);
    const post = querySnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() } as Post ));
    console.log(post);
    return { post };
    
}

export async function generateMetadata({ params }: Props) : Promise<Metadata> {

    const postTitleWithSpaces = decodeURIComponent(params.postTitle as string).split("-").join(" ");
    const { post }= await fetchPost(postTitleWithSpaces);
    const metadata: Metadata = {
        title: post[0]?.title,
        description: post[0]?.description,
        keywords: post[0]?.keywords,
        // answerKeywords: post[0].answerKeywords
        openGraph: {
            title: post[0]?.title,
            description: post[0]?.description,
            type: "website",
            locale: "en_US",
            url: "https://devotional-b.vercel.app",
        },
    };
    return metadata;
    
}

// export const metadata: Metadata = {
//   title: "Your Questions Answered",
//   description: "Get all your answers here.",
// };

export default function PostPage({
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
