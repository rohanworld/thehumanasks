

import { MetadataRoute } from "next";

import { collection , query , getDocs } from "firebase/firestore";
import { db } from "@/utils/firebase";

type Post = {
    title: string;
}

type ForumPost = {
    title: string;
    forumName: string;
}

//Fetch all posts from firestore
export async function getPosts(){
    const postsRef = collection(db, "questions");
    const q = query(postsRef);

    const posts = <any>[];
    const querySnapshot = await getDocs(q);
    querySnapshot.forEach((doc) => {
        posts.push(doc.data() as Post);
    });

    return posts;
}

export async function getPolls(){
    const pollsRef = collection(db, "polls");
    const q = query(pollsRef);

    const polls = <any>[];
    const querySnapshot = await getDocs(q);
    querySnapshot.forEach((doc) => {
        polls.push(doc.data() as Post);
    });

    return polls;
}

export async function getEvents(){
    const eventsRef = collection(db, "events");
    const q = query(eventsRef);

    const events = <any>[];
    const querySnapshot = await getDocs(q);
    querySnapshot.forEach((doc) => {
        events.push(doc.data() as Post);
    });

    return events;
}

export async function getForumsPosts(){
    const forumsRef = collection(db, "forumPosts");
    const q = query(forumsRef);

    const forumsP = <any>[];
    const querySnapshot = await getDocs(q);
    querySnapshot.forEach((doc) => {
        forumsP.push(doc.data() as ForumPost);
    });

    return forumsP;
}

export default async function sitemap(){

    const baseUrl = "https://thegodsays.vercel.app";

    const posts = await getPosts();
    
    const postsUrls = posts?.map((post:any) => {
        return{
            url: `${baseUrl}/${post.title.split(" ").join("-")}`,
            lastModified: new Date().toISOString(),
        }
    }) ?? [];

    const polls = await getPolls();

    const pollsUrls = polls?.map((poll:any) => {
        return{
            url: `${baseUrl}/poll/${poll.title.split(" ").join("-")}`,
            lastModified: new Date().toISOString(),
        }
    }) ?? [];

    const events = await getEvents();

    const eventsUrls = events?.map((event:any) => {
        return{
            url: `${baseUrl}/event-details/${event.title.split(" ").join("-")}`,
            lastModified: new Date().toISOString(),
        }
    }) ?? [];

    const forumPostss = await getForumsPosts();

    const forumPostsUrls = forumPostss?.map((fpost:any) => {
        return{
            url: `${baseUrl}/forums/${fpost?.forumName?.split(" ")?.join("-")}/post/${fpost.title.split(" ").join("-")}`,
            lastModified: new Date().toISOString(),
        }
    }) ?? [];

    return[
        {
            url: baseUrl,
            lastModified: new Date().toISOString(),
        },
        ...postsUrls,
        ...pollsUrls,
        ...eventsUrls,
        ...forumPostsUrls
    ]
    
}