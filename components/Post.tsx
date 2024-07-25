"use client";

import React, { useState, useRef, useEffect } from "react";

import parse from "html-react-parser";

import { MessageSquare } from "lucide-react";
import { Share } from "lucide-react";
import { Bookmark } from "lucide-react";
import ShareDialog from "./ShareDialog";
// import { Trash2 } from "lucide-react";
import { AiTwotoneDelete } from "react-icons/ai";
import { RiUserFollowLine } from "react-icons/ri";
//import {Progress} from "@nextui-org/react";
import { useDispatch, useSelector } from "react-redux";
import { userCache } from "@/store/slice";
import { updateUserCache } from "@/store/slice";

import Link from "next/link";
import Image from "next/image";
import { Progress } from "@/components/ui/progress"

import PostVoteClient from "./post-vote/PostVoteClient";
import PostVoteClientPhone from "./post-vote/PostVoteClientPhone";
import { Avatar, AvatarFallback } from "./ui/avatar";

import { formatTimeToNow } from "@/lib/date";
import { Separator } from "./ui/separator";
import { Button } from "./ui/button";

import { auth, db } from "@/utils/firebase";
import { useAuthState } from "react-firebase-hooks/auth";

import { useToast } from "./ui/use-toast";
import { cn } from "@/lib/utils";

import {
  arrayRemove,
  arrayUnion,
  doc,
  updateDoc,
  getDoc,
  onSnapshot,
  deleteDoc,
  setDoc,
} from "firebase/firestore";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

type UserData = {
  following: Array<string>;
  followers: Array<string>;
  name: string;
  email: string;
};

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
    options:Array<any>;
    questionImageURL: string;
    createdAt: any;
    anonymity: boolean;
    uid: string; // User ID of the post creator
    // ansNumbers: number
  };
  // children: Element
  // id: string
  isProfile?: boolean;
  othersProfile?: boolean;
  handleDelete?: Function;
};

const Post = ({ post, isProfile = false, othersProfile , handleDelete = () => {} }: Props) => {
  const pRef = useRef<HTMLDivElement>(null);
  const dispatch = useDispatch();
  const userCacheData = useSelector(userCache);
  //console.log("Answer Posr: ", post);
  const { toast } = useToast();

  const isAnonymous = post.anonymity;

  //for displaying 'more' button
  const [isExpanded, setIsExpanded] = useState(false);
  const [isOverflowing, setIsOverflowing] = useState(false);

  //needed to send it to PostVoteClientPhone so that it can get the current user's vote
  const [user, loading] = useAuthState(auth);

  //saving the post funcitonality
  const [savedState, setSavedState] = useState(false);

  const [isFollowing, setIsFollowing] = useState(false); // State to track if the user is following this post's creator
  const [isCurrentUser, setIsCurrentUser] = useState(false); // State to track if the post's creator is the current user

  const fetchQuestion = async () => {
    //console.log("hii ", post.title, post.uid);
    if (post.title == undefined) {
      if (post.uid) {
        const questionRef = doc(db, "questions", post.uid);
        const questionDoc = await getDoc(questionRef);

        console.log(questionDoc, " * ", questionDoc.exists());
        if (questionDoc.exists()) {
          const questionData = questionDoc.data();
          console.log(questionData);
        }
      }
    }
  };

  const HandleDelete = () => {
    handleDelete(post.id);
  };

  const handleSave = async () => {
    if (!user || user.isAnonymous == true) {
      toast({
        title: " Please sign in to save posts ",
        variant: "destructive",
      });
      return;
    }

    const userRef = doc(db, "users", user.uid);

    if (savedState) {
      //post is currently saved remove it from saved posts
      await updateDoc(userRef, {
        savedPosts: arrayRemove(post.id),
      });
      toast({
        title: " Post removed from saved ",
        variant: "default",
      });
    } else {
      //post is currently not saved add it to saved posts
      await updateDoc(userRef, {
        savedPosts: arrayUnion(post.id),
      });
      toast({
        title: " Post saved ",
        variant: "default",
      });
    }

    setSavedState(!savedState);
  };


  useEffect(() => {
    if (pRef.current) {
      setIsOverflowing(pRef.current.scrollHeight > pRef.current.clientHeight);
    }
  }, [pRef]);

  
  useEffect(() => {
    // Check if the current user is following the post's creator
    if(isProfile==false){
    if (post.uid && !userCacheData[post.uid]) {
      const fetchUserData = async () => {
        if (user) {
          const userRef = doc(db, "users", user.uid);
          const unsubscribe = onSnapshot(userRef, (doc) => {
            if (doc.exists()) {
              const userData = doc.data() as UserData;
              setIsFollowing(userData.following.includes(post.uid)); // Update isFollowing based on the following list
              setIsCurrentUser(user.uid === post.uid); // Check if the post's creator is the current user
              dispatch(updateUserCache({ uid: post.uid, userData }));
            }
          });

          return () => unsubscribe();
        }
        //const userData = {id: post.uid};
      };
      fetchUserData();
    } else {
      //console.log("FollowCache: ", userCacheData[post.uid]);
      setIsFollowing(userCacheData[post.uid].following.includes(post.uid));
      if (user) {
        setIsCurrentUser(user.uid === post.uid);
      }
    }
  }
  }, [post.uid, userCacheData, dispatch]);

  //fetching savedPosts from user's document
  useEffect(() => {
    const fetchUser = async () => {
      if (!user) return;
      const userRef = doc(db, "users", user.uid);
      const userDoc = await getDoc(userRef);

      if (userDoc.exists()) {
        const userData = userDoc.data();
        const savedPosts = userData.savedPosts;

        // If the post is in the savedPosts array, set savedState to true
        if (savedPosts.includes(post.id)) {
          setSavedState(true);
        } else {
          // If the post is not in the savedPosts array, set savedState to false
          // unless it's the recently saved post (post.id === savedPostId)
          // setSavedState(post.id === savedPostId);
        }
      }
    };

    fetchUser();
  }, [post.id, user]);

  //for displaying 'more' button
  useEffect(() => {
    // Assuming a line height of around 20px
    const maxHeight = 25 * 3;

    if (pRef.current && pRef.current.offsetHeight > maxHeight) {
      setIsOverflowing(true);
    } else {
      setIsOverflowing(false);
    }
  }, [post.description]);

  //console.log("Id: ", post.uid, " ",  post.title);

  const handleFollow = async () => {
    if (!user || (user && user.isAnonymous == true)) {
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
        title: isFollowing
          ? "You have unfollowed this user ❌"
          : "You are now following this user ✅",
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

  //fetching poll data
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
          //console.log("UserV: ", userVoteDoc.data().option);
        }
        
      }
    };

    fetchPollData();
    fetchUserVote();
  }, [post.id, user]);

  let totalVotes = 0;
  let isPoll = false;
  if(pollData?.options!=null){
    //console.log("PstCmnt: ", post.comments);
    isPoll = true;
    const vt = pollData.options.reduce((acc:any, option:any) => {
      const optionKey = Object.keys(option)[0];
      return acc + option[optionKey];
    }, 0);
    totalVotes=vt
  }

  //for voting and unvoting
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
    if (userVote === optionKey) {
      await deleteDoc(userVoteRef); // Unvote if the same option is clicked
      setUserVote(null);
      toast({
        title: "Unvoted",
        variant: "default",
      });
    } else {
      await setDoc(userVoteRef, { option: optionKey });
      setUserVote(optionKey);
      toast({
        title: "Voted",
        variant: "default",
      });
    }
  
    // Update the local state
    setPollData((prevPollData: any) => ({
      ...prevPollData,
      options: updatedOptions,
    }));
  };  

  let dateString;
    if (post.createdAt) {
      let date;
      // console.log('Type of post.dateOfEvent:', typeof post.createdAt);
      // console.log('Value of post.dateOfEvent:', post.createdAt);
      if (typeof post.createdAt === 'string') {
        date = new Date(post.createdAt);
      } else if (typeof post.createdAt === 'number') {
        date = new Date(post.createdAt * 1000); // Multiply by 1000 if your timestamp is in seconds
      } else if (post.createdAt.toDate !== undefined) {
        date = post.createdAt.toDate();
      } else {
        console.error('post.dateOfEvent is neither a string, a number, nor a Timestamp');
        // Handle this case as appropriate for your application
      }
      if (date) {
        dateString = date.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
      }
    }


  return (
    <>
      {post.uid ? (
        <div className="bg-[#ffffff] dark:bg-[rgb(75,63,63)] font-style-6-post mb-3 my-[14px] fade-in">
          <div className="px-6 py-4 flex justify-between space-x-4 rounded-[4px]">
            <div className="w-0 flex-1 break-normal overflow-hidden">
              <Link href={`/${isPoll ? `poll/${encodeURIComponent(post?.title?.split(" ").join("-"))}` : encodeURIComponent(post?.title?.split(" ").join("-"))}`} prefetch>
                {!isProfile && (
                  <div className="flex max-h-40 mt-1 space-x-2 text-xs">
                    <Avatar>
                      <div className="relative w-full h-full aspect-square">
                        <img
                          className="fade-in"
                          src={isAnonymous ? "https://e7.pngegg.com/pngimages/416/62/png-clipart-anonymous-person-login-google-account-computer-icons-user-activity-miscellaneous-computer.png" : post.profilePic}
                          alt="profile picture"
                        />
                      </div>
                    </Avatar>
                    <div className="flex space-x-2">
                      <span className="font-style-5-username mt-3 text-sm text-[#0c0c0c] font-semibold dark:text-yellow-50">
                        {isAnonymous ? (
                          "Anonymous"
                        ) : (
                          <Link href={`/profile/${post.uid}`} className="hover:underline cursor-pointer">
                            {post.name}
                          </Link>
                        )}
                      </span>
                      {isAnonymous || isCurrentUser || !user ? null : (
                        <div className="flex space-x-1 mr-5">
                          <svg viewBox="0 0 48 48" className="mt-[1.20rem] mr-1 w-1 h-1" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M24 36C30.6274 36 36 30.6274 36 24C36 17.3725 30.6274 12 24 12C17.3726 12 12 17.3725 12 24C12 30.6274 17.3726 36 24 36Z" fill="#333333"></path>
                          </svg>
                          <button className="font-style-4 text-[14px] mt-[0.33rem] text-blue-500 p-0 hover:underline cursor-pointer" onClick={handleFollow}>
                            {isFollowing ? "Following" : "Follow"}
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                )}
                <div className={`${post.title ? "" : "hidden"}`}>
                  <h1 className={`font-style-2 py-2 leading-6 dark:text-white ${isExpanded ? "hover:underline" : ""}`}>
                    {post.title}
                  </h1>
                </div>
                {post.questionImageURL && (
                  <div className="relative w-full h-60">
                    <img src={post.questionImageURL} className="fade-in" alt="post image" />
                  </div>
                )}
                <div className={`relative text-sm max-h-20 w-full overflow-clip ${isExpanded ? "max-h-none expand-content" : ""}`} ref={pRef}>
                  <p onClick={fetchQuestion} className="font-style-3 dark:text-white">
                    {parse(post.description)}
                  </p>
                  {!isExpanded && isOverflowing && (
                    <div className="absolute bottom-0 left-0 h-24 w-full bg-gradient-to-t from-white/95 dark:from-[#262626] to-transparent"></div>
                  )}
                  {!isExpanded && isOverflowing && (
                    <div className="absolute bottom-0 md:bottom-[-0.16rem] left-0 w-full text-right">
                      <button className="hover:underline md:w-[8%] w-full backdrop-blur-none bg-white/50 dark:bg-transparent text-right text-sm" onClick={() => setIsExpanded(true)}>
                        (more)
                      </button>
                    </div>
                  )}
                </div>
              </Link>
              {isPoll && (
                <div className="mt-[1rem]">
                  {pollData.options.map((option:any, index:any) => {
                    const optionKey = Object.keys(option)[0];
                    const optionValue = option[optionKey];
                    const progressValue = totalVotes ? (optionValue / totalVotes) * 100 : 0;
                    return (
                      <div key={index} className="w-[95%] flex gap-2 items-center">
                        <div className="relative w-full">
                          <Progress value={progressValue} className="h-[2rem] font-style-2 border-2 border-black" />
                          <div className="absolute top-[11px] left-4 font-style-3-vote">{optionKey}<span className="ml-[1rem] text-blue-500">{`${progressValue.toFixed(1)} % Votes`}</span></div>
                        </div>
                        <div>
                          {user?.isAnonymous ? (
                            <Button className="rounded-3xl font-style-3-vote border-2 text-center border-black h-[2rem] bg-transparent hover:text-black text-black hover:bg-[#e4dcdc]" onClick={() => {
                              toast({
                                title: "Sign in to Vote",
                                variant: "destructive",
                              });
                            }}>Vote</Button>
                          ) : (
                            <Button className={`rounded-3xl border-2 font-style-3-vote text-center text-white hover:text-white border-black h-[2rem] ${userVote == optionKey ? "bg-black" : "bg-transparent text-black hover:text-black hover:bg-[#e4dcdc]"}`} onClick={() => handleVote(optionKey)}>Vote</Button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
            <div className="flex-col space-y-6 items-center justify-center my-auto">
              <button className="font-style-4 w-fit flex items-center gap-2">
                <ShareDialog postLink={`/${encodeURIComponent(post?.title?.split(" ").join("-"))}`} />
              </button>
              <button className="w-fit flex items-center gap-2" onClick={handleSave}>
                <Bookmark className={`font-style-4 h-4 w-4 font-style-4 ${savedState ? "text-black fill-black" : ""}`} />
                {savedState ? (
                  <span className="font-style-4 sm:block hidden text-black dark:text-white">Saved</span>
                ) : (
                  <span className="font-style-4 sm:block hidden text-black dark:text-white">Save</span>
                )}
              </button>
            </div>
          </div>
          <div className="rounded-b-md bg-[#e7e7e7] dark:bg-[#1A1A1B]/65 z-20 flex gap-x-3 text-sm px-3 py-3 sm:px-6">
            <PostVoteClientPhone postId={post.id} postType={post.options != null ? "polls" : "questions"} userId={user?.uid!} />
            <div className="ml-2 mt-2 flex justify-between w-full">
              <Link href={`/${isPoll ? `poll/${encodeURIComponent(post?.title?.split(" ").join("-"))}` : encodeURIComponent(post?.title?.split(" ").join("-"))}`} className="w-fit flex items-center gap-2">
                <MessageSquare className="h-4 w-4 postvotec" />
                <span className="font-style-4 sm:block hidden postvotec text-black dark:text-white">
                  {post.comments} Answers
                </span>
              </Link>
              <div className="flex justify-center gap-3 items-center">
                <div>Posted on: {dateString}</div>
                {isProfile && !othersProfile && (
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <button className="w-fit flex items-center gap-2">
                        <AiTwotoneDelete className="text-xl" />
                      </button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>
                          Are you absolutely sure?
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                          This action cannot be undone. This will permanently delete your post and remove the data from our servers.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={HandleDelete}>
                          Delete
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                )}
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div></div>
      )}
    </>
  );
};

export default Post;