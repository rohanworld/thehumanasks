"use client";

import React, { useRef , useState , useEffect } from "react";

import parse from "html-react-parser";

import { MessageSquare } from "lucide-react";
import { Share } from "lucide-react";
import { Bookmark } from "lucide-react";

import Link from "next/link";
import Image from "next/image";

import PostVoteClient from "@/components/post-vote/PostVoteClient";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useToast } from "@/components/ui/use-toast";
import { cn } from "@/lib/utils";

import { formatTimeToNow } from "@/lib/date";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import PostVoteClientPhone from "../post-vote/PostVoteClientPhone";
import ShareDialog from "../ShareDialog";

import { auth } from "@/utils/firebase";
import { useAuthState } from "react-firebase-hooks/auth";
import { db } from "@/utils/firebase";
import { doc, getDoc, updateDoc , arrayRemove, arrayUnion, onSnapshot, deleteDoc, setDoc } from "firebase/firestore";
import { Progress } from "../ui/progress";

type Props = {
  post: {
    id: string;
    title: string;
    name: string;
    description: string;
    profilePic: string;
    postImage: string;
    likes: number;
    comments: number;
    shares: number;
    questionImageURL: string;
    createdAt: any;
    anonymity: boolean;
    hashtags: any;
    uid: string;
  };
  // id: string
};

const PollsQuePost = ({ post }: Props) => {

  const { toast } = useToast();
  //console.log(post)

  //to send userId in postvoteclient for voting system
  const [user] = useAuthState(auth);

  const [isFollowing, setIsFollowing] = useState(false); // State to track if the user is following this post's creator
  const [isCurrentUser, setIsCurrentUser] = useState(false); // State to track if the post's creator is the current user
  
  const pRef = useRef<HTMLDivElement>(null);

  const isAnonymous = post.anonymity;

  //handling the saving Post functionality
  //saving the post funcitonality
  const [savedState , setSavedState] = useState(false);

  const handleSave = async() => {

    if(!user)
    {
      toast({
        title:' Please sign in to save posts ',
        variant:'destructive',
      })
      return;
    }
    
      const userRef = doc(db , 'users' , user.uid);
    

    if(savedState)
    {
      //post is currently saved remove it from saved posts
      await updateDoc(userRef , {
        savedPosts: arrayRemove(post.id)
      })
      toast({
        title:' Post removed from saved ',
        variant:'default',  
      })
    }else{
      //post is currently not saved add it to saved posts
      await updateDoc(userRef , {
        savedPosts: arrayUnion(post.id),
      })
      toast({
        title:' Post saved ',
        variant:'default',
      })
    }


      setSavedState(!savedState);
  }

  //fetching savedPosts from user's document
  useEffect(() => {
    const fetchUser = async () => {
      if(!user) return;
        const userRef = doc(db, 'users', user.uid); // Replace 'user.uid' with the actual user ID
        const userDoc = await getDoc(userRef);

        if (userDoc.exists()) {
            const userData = userDoc.data();
            if (userData.savedPosts.includes(post.id)) {
                setSavedState(true);
            }
        }
    };

    fetchUser();
}, [post.id , user ]);

useEffect(() => {
  // Check if the current user is following the post's creator
  if (user) {
    const userRef = doc(db, "users", user.uid);
    const unsubscribe = onSnapshot(userRef, (doc) => {
      if (doc.exists()) {
        const userData = doc.data();
        setIsFollowing(userData.following.includes(post.uid)); // Update isFollowing based on the following list
        setIsCurrentUser(user.uid === post.uid); // Check if the post's creator is the current user
      }
    });

    return () => unsubscribe();
  }
}, [post.uid, user]);

const handleFollow = async () => {

  if (!user||(user&&user.isAnonymous==true)) {
    toast({
      title: " Please login to follow others ",
      variant: "destructive",
    });
    return;
  }

  const userRef = doc(db, "users", user.uid);

  try {
    await updateDoc(userRef, {
      following: isFollowing
        ? arrayRemove(post.uid) // Unfollow if already following
        : arrayUnion(post.uid), // Follow if not following
    });

    setIsFollowing(!isFollowing); // Update isFollowing state

    // Update followers list of the post's creator
    const postUserRef = doc(db, "users", post.uid);
    await updateDoc(postUserRef, {
      followers: isFollowing
        ? arrayRemove(user.uid) // Remove follower if unfollowing
        : arrayUnion(user.uid), // Add follower if following
    });

    // Show toast notification based on follow/unfollow action
    toast({
      title: isFollowing ? "You have unfollowed this user ❌" : "You are now following this user ✅",
      variant: "default",
    });

  } catch (error) {
    console.error("Error updating following list:", error);
    toast({
      title: "Error updating following list",
      variant: "destructive",
    });
  }
};

const [pollData, setPollData] = useState<any>(null);
  const [userVote, setUserVote] = useState(null);

  //fetching polls data
  useEffect(() => {
    const fetchPollData = async () => {
      const pollDoc = await getDoc(doc(db, 'polls', post.id));
      if (pollDoc.exists()) {
        setPollData(pollDoc.data());
      } else {
        console.error('Poll document not found');
      }
    };

    const fetchUserVote = async () => {
      if (user) {
        const userVoteDoc = await getDoc(doc(db, 'polls', post.id, 'pollvotes', user.uid));
        if (userVoteDoc.exists()) {
          setUserVote(userVoteDoc.data().option);
        }
      }
    };

    fetchPollData();
    fetchUserVote();
  }, [post.id, user]);

  let totalVotes = 0;
  let isPoll = false;
  if(pollData?.options!=null){
    isPoll = true;
    const vt = pollData.options.reduce((acc:any, option:any) => {
      const optionKey = Object.keys(option)[0];
      return acc + option[optionKey];
    }, 0);
    totalVotes=vt
  }

  //handling voting and unvoting
  const handleVote = async (optionKey: any) => {
    if (!user) {
      toast({
        title: "Login to vote",
        variant: "destructive",
      });
      console.error('User not logged in');
      return;
    }
  
    const pollRef = doc(db, 'polls', post.id);
    const userVoteRef = doc(db, 'polls', post.id, 'pollvotes', user.uid);
  
    const updatedOptions = pollData.options.map((option: any) => {
      const key = Object.keys(option)[0];
      const value = option[key];
  
      if (key === optionKey) {
        if (userVote === optionKey) {
          return { [key]: value - 1 }; // Unvote if the same option is clicked
        } else {
          return { [key]: value + 1 }; // Vote for the new option
        }
      } else if (key === userVote) {
        return { [key]: value - 1 }; // Remove vote from the previous option
      }
  
      return option;
    });
  
    // Update the Firestore document
    await updateDoc(pollRef, { options: updatedOptions });
  
    // Update the user's vote
    let toastMessage;
    if (userVote === optionKey) {
      await deleteDoc(userVoteRef); // Unvote if the same option is clicked
      setUserVote(null);
      toastMessage = "Unvoted";
    } else {
      await setDoc(userVoteRef, { option: optionKey });
      setUserVote(optionKey);
      toastMessage = "Voted";
    }
  
    // Update the local state
    setPollData((prevPollData: any) => ({
      ...prevPollData,
      options: updatedOptions,
    }));
  
    toast({
      title: toastMessage,
      variant: "default",
    });
  };  

  let dateString;
  if (post.createdAt) {
  const date = post.createdAt.toDate();
  dateString = date.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  }

  return (

    <div className="rounded-2xl bg-white dark:bg-[#262626] break-words overflow-hidden mt-1 font-dmsans shadow-[0px_0px_0px_1px_rgba(8,112,184,0.06),0px_1px_1px_-0.5px_rgba(8,112,184,0.06),0px_3px_3px_-1.5px_rgba(8,112,184,0.06),_0px_6px_6px_-3px_rgba(8,112,184,0.06),0px_12px_12px_-6px_rgba(8,112,184,0.06),0px_24px_24px_-12px_rgba(8,112,184,0.06)]">
      <div className="px-6 md:py-6 py-4 flex justify-between">

        {/* <PostVoteClient
        //   postId={post.id}
        //   initialVotesAmt={_votesAmt}
        //   initialVote={_currentVote?.type}
        /> */}

        <div className="w-0 flex-1">
          <div className="flex justify-between max-h-60 mt-1 space-x-2 text-xs">
            {/* <div> */}
            <div className="flex gap-3">
            <Avatar>
              <div className=" relative w-full h-full aspect-square">
                <Image
                  fill
                  src={isAnonymous ? ('https://e7.pngegg.com/pngimages/416/62/png-clipart-anonymous-person-login-google-account-computer-icons-user-activity-miscellaneous-computer.png') : (post.profilePic)}
                  alt="profile picture"
                  referrerPolicy="no-referrer"
                />
              </div>
              {/* <AvatarFallback>SP</AvatarFallback> */}
            </Avatar>
            {/* </div> */}
            {/* <Separator orientation="vertical" className=" h-5 mt-3 " /> */}
            <div className="flex gap-2">
            <span className="mt-3 text-[#0c0c0c]  text-sm font-semibold dark:text-white">{isAnonymous ? ('Anonymous') : <Link className=" hover:underline cursor-pointer" href={`/profile/${post.uid}`}>{post.name}</Link>}</span>{" "}
            {isAnonymous||isCurrentUser || !user ? null : (
              <div className=" flex space-x-1 mr-5">
                <svg
                  viewBox="0 0 48 48"
                  className=" mt-[1.20rem] mr-1 w-1 h-1"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <g id="SVGRepo_bgCarrier" stroke-width="0"></g>
                  <g
                    id="SVGRepo_tracerCarrier"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                  ></g>
                  <g id="SVGRepo_iconCarrier">
                    {" "}
                    <path
                      d="M24 36C30.6274 36 36 30.6274 36 24C36 17.3725 30.6274 12 24 12C17.3726 12 12 17.3725 12 24C12 30.6274 17.3726 36 24 36Z"
                      fill="#333333"
                    ></path>{" "}
                  </g>
                </svg>

                <div
                  className=" text-blue-500 font-style-5-username mt-[0.87rem] p-0 hover:underline cursor-pointer"
                  onClick={handleFollow}
                >
                  {isFollowing ? "Following" : "Follow"}
                </div>
              </div>
            )}
            </div>
            </div>
            <div className="mt-[11px]">{dateString}</div>
          </div>
          {/* <a href={`/postPage/${post.id}`}> */}
            <h1 className="font-style-4 py-3 leading-6 dark:text-white">
              {post.title}
            </h1>
          {/* </a> */}

          {post.questionImageURL ? (
            <div className="relative w-full h-[400px]">
              <Image
                src={post.questionImageURL}
                className="rounded-md"
                alt="question image"
                layout="fill"
                objectFit="contain"
              />
            </div>
          ) : null}

          <div
            className="relative text-base max-h-50 w-full  "
            ref={pRef}
          >
            {/* <EditorOutput content={post.content} /> */}
            <p className="ProseMirror font-style-3 dark:text-white">{post.description ? parse(post.description) : ""}</p>
            {/* <div className='absolute bottom-0 left-0 h-24 w-full bg-gradient-to-t from-white/80 dark:from-[#262626] to-transparent'></div> */}
            {/* {pRef.current?.clientHeight === 160 ? (
              // blur bottom if content is too long
              
            ) : null} */}
          </div>
          <div>
          {
          (post.hashtags&&(Array.isArray(post.hashtags))&&(post.hashtags.length>0))&&
            <div className=' mt-4'>
              {
                post.hashtags.map((hashtag:any, index:number)=>{
                  return <span className="mx-1 font-[500] text-sm" key={index} >{hashtag}</span>
                })
              }
            </div>
}
          </div>
          <div>
                {isPoll&&
              <div className="mt-[1rem]">
              {
              pollData.options.map((option:any, index:any)=>{

                const optionKey = Object.keys(option)[0];
                const optionValue = option[optionKey];
                const progressValue = totalVotes ? (optionValue / totalVotes) * 100 : 0;

                return <div key={index} className="w-[95%] flex gap-2 items-center">
                <div className="relative w-full">
            <Progress value={progressValue} className="h-[2rem] border-2 border-black" />
            <div className="absolute top-[11px] font-style-3-vote left-4">{optionKey}<span className="ml-[1rem] text-blue-500">{`${progressValue.toFixed(1)} % Votes`}</span></div>
            </div>
            <div>
              {
                user?.isAnonymous?<Button className={`rounded-3xl border-2 text-center font-style-3-vote border-black h-[2rem] bg-transparent text-black hover:text-black hover:bg-[#b6b8bd]`} onClick={() => {toast({
                  title: "Sign in to Vote",
                  variant: "destructive",
                });}}>Vote</Button>:<Button className={`font-style-3-vote rounded-3xl text-white hover:text-white border-2 text-center border-black h-[2rem] ${userVote==optionKey?"bg-black":"bg-transparent text-black hover:text-black hover:bg-[#e4dcdc]"}`} onClick={() => handleVote(optionKey)}>Vote</Button>
              }
            </div>
            </div>
              })
}
            </div>
}
            </div>
        </div>
      </div>

      
      <div className=" dark:bg-[#1A1A1B]/65 rounded-b-2xl z-20 flex justify-between gap-x-3 text-sm px-4 py-4 sm:px-6">

        <PostVoteClientPhone postId={post.id} postType="polls" userId={user?.uid!}/>

        <div className=" flex gap-x-3">
            <button
              className="w-fit flex items-center gap-2"
            >
            <ShareDialog postLink={`/poll/${post?.title?.split(" ").join("-")}`}/>
          </button>
          <button
            className="w-fit flex items-center gap-2"
            onClick={handleSave}
          >
            <Bookmark className={cn("h-4 w-4", {" text-black fill-black" : savedState == true,})} />{" "}
            {savedState ? (<span className=" sm:block hidden">Saved</span>) : (<span className=" sm:block hidden">Save</span>)}
          </button>
        </div>
        
        
      </div>
    </div>
  );
};

export default PollsQuePost;