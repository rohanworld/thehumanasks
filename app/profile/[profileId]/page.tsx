"use client";

import ProfileCard from "@/components/profilePage/ProfileCard";
import Image from "next/image";
import React, { useEffect, useState, useRef } from "react";
import ForumPost from "@/components/ForumPost";
import { useRouter } from "next/navigation";
import { auth, db } from '@/utils/firebase';
import { useAuthState } from 'react-firebase-hooks/auth';
import { collection, query, where, onSnapshot, orderBy, and, startAfter, limit, getDocs, doc, getDoc, deleteDoc, collectionGroup, Timestamp } from 'firebase/firestore';
import { useCollectionData } from 'react-firebase-hooks/firestore';
import Post from '@/components/Post';
import AnswerPost from '@/components/AnswerPost';
import Loader from '@/components/ui/Loader';
import { Button } from '@/components/ui/button';
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import UserDetails from "@/components/UserDetails";
import { AlbumArtwork } from "@/app/events/components/album-artwork";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuPortal,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { useToast } from "@/components/ui/use-toast";
import { FaChevronDown } from "react-icons/fa6";

type Props = {
  params: {
    profileId: string;
  };
};

type PostType = {
  id: string;
  name: string;
  title: string;
  description: string;
  profilePic: string;
  postImage: string;
  options: Array<any>;
  likes: number;
  shares: number;
  comments: number;
  questionImageURL: string;
  createdAt: string;
  anonymity: boolean;
  uid: string;
};

type ForumPostType = {
  id: string;
  name: string;
  title: string;
  description: string;
  profilePic: string;
  postImage: string;
  options: Array<any>;
  likes: number;
  shares: number;
  comments: number;
  questionImageURL: string;
  createdAt: string;
  anonymity: boolean;
  uid: string;
};

type AnswerType = {
  id: string;
  name: string;
  description: string;
  profilePic: string;
  answerImageURL: any;
  voteAmt: number;
  questionId: string;
  questionTitle: string;
  createdAt: string;
  anonymity: boolean;
  uid: string;
};

const UserProfilePage = ({ params: { profileId } }: Props) => {
  const router = useRouter();
  const [user, loading] = useAuthState(auth);

  const loadMoreButtonRef = useRef<HTMLDivElement>(null);

  const [answers, setAnswers] = useState<AnswerType[]>([]);
  const [answerLastDoc, setAnswerLastDoc] = useState<any>(null);
  const [answerStart, setAnswerStart] = useState<boolean>(true);
  const [answerMorePosts, setAnswerMorePosts] = useState(false);

  const [forumPosts, setforumPosts] = useState<ForumPostType[]>([]);
  const [foumPostLastDoc, setForumPostLastDoc] = useState<any>(null);
  const [forumPostStart, setForumPostStart] = useState<boolean>(true);
  const [forumPostMorePosts, setForumPostMorePosts] = useState(false);

  const [postType, setPostType] = useState("normal");
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [isAnswers, setIsAnswers] = useState(false);
  const [isForumPosts, setIsForumPosts] = useState(false);
  const [questions, setQuestions] = useState<PostType[]>([]);
  const [anonymousQuestions, setAnonymousQuestions] = useState<PostType[]>([]);
  const [loadingPosts, setLoadingPosts] = useState(true);
  const [LastDoc, setLastDoc] = useState<any>(null);
  const [anonymousMorePosts, setAnonymousMorePosts] = useState(false);
  const [anonymousLastdoc, setAnonymousLastdoc] = useState<any>(null);
  const [start, setStart] = useState<boolean>(true);
  const [anonymousStart, setAnonymousStart] = useState<boolean>(true);
  const [morePosts, setMorePosts] = useState(false);
  const [sortType, setSortType] = useState("recent");
  const [reload, setReload] = useState(false);
  const { toast } = useToast();

  const [loadMore, setLoadMore] = useState<boolean>(false);

  //fetching users posts
  const fetchData = async () => {
    try {
      setLoadingPosts(true);
      const questionsRef = collection(db, "questions");
      let q;

      if (postType === "normal") {
        if (start) {
          q = query(
            questionsRef,
            and(
              where("uid", "==", profileId),
              where("anonymity", "==", false)
            ),
            orderBy("createdAt", sortType === 'recent' ? "desc" : "asc"),
            limit(7)
          );
          const snapshot = await getDocs(q);
          setQuestions(
            snapshot.docs.map(
              (doc) => ({ id: doc.id, ...doc.data() } as PostType)
            )
          );
          const lastdoc = snapshot.docs[snapshot.docs.length - 1];
          if (lastdoc) setMorePosts(true);
          else setMorePosts(false);
          setLastDoc(lastdoc);
          setStart(false);
        } else {
          const moreQ = query(
            questionsRef,
            and(
              where("uid", "==", profileId),
              where("anonymity", "==", false)
            ),
            orderBy("createdAt", sortType === 'recent' ? "desc" : "asc"),
            startAfter(LastDoc),
            limit(7)
          );

          const moreSnapshot = await getDocs(moreQ);
          setQuestions((prevQuestions) => [
            ...prevQuestions,
            ...moreSnapshot.docs.map(
              (doc) => ({ id: doc.id, ...doc.data() } as PostType)
            ),
          ]);
          const lastdoc = moreSnapshot.docs[moreSnapshot.docs.length - 1];
          if (lastdoc) setMorePosts(true);
          else setMorePosts(false);
          setLastDoc(lastdoc);
        }
      } else if (postType === "anonymous") {
        if (anonymousStart) {
          q = query(
            questionsRef,
            and(
              where("uid", "==", profileId),
              where("anonymity", "==", true)
            ),
            orderBy("createdAt", sortType === 'recent' ? "desc" : "asc"),
            limit(7)
          );
          const snapshot = await getDocs(q);
          setAnonymousQuestions(
            snapshot.docs.map(
              (doc) => ({ id: doc.id, ...doc.data() } as PostType)
            )
          );
          const lastdoc = snapshot.docs[snapshot.docs.length - 1];
          if (lastdoc) setAnonymousMorePosts(true);
          else setAnonymousMorePosts(false);
          setAnonymousLastdoc(lastdoc);
          setAnonymousStart(false);
        } else {
          const moreQ = query(
            questionsRef,
            and(
              where("uid", "==", profileId),
              where("anonymity", "==", true)
            ),
            orderBy("createdAt", sortType === 'recent' ? "desc" : "asc"),
            startAfter(anonymousLastdoc),
            limit(7)
          );

          const moreSnapshot = await getDocs(moreQ);
          setAnonymousQuestions((prevQuestions) => [
            ...prevQuestions,
            ...moreSnapshot.docs.map(
              (doc) => ({ id: doc.id, ...doc.data() } as PostType)
            ),
          ]);
          const lastdoc = moreSnapshot.docs[moreSnapshot.docs.length - 1];
          if (lastdoc) setAnonymousMorePosts(true);
          else setAnonymousMorePosts(false);
          setAnonymousLastdoc(lastdoc);
        }
      } else if (postType == "answers") {
        if (answerStart) {
          q = query(
            collection(db, "answers"),
            where("uid", "==", profileId),
            orderBy("createdAt", sortType === 'recent' ? "desc" : "asc"),
            limit(7)
          );
          const snapshot = await getDocs(q);
          setAnswers(
            snapshot.docs.map(
              (doc) => ({ id: doc.id, ...doc.data() } as AnswerType)
            )
          );
          const lastdoc = snapshot.docs[snapshot.docs.length - 1];
          if (lastdoc) setAnswerMorePosts(true);
          else setAnswerMorePosts(false);
          setAnswerLastDoc(lastdoc);
          setAnswerStart(false);
        } else {
          const moreQ = query(
            collection(db, "answers"),
            where("uid", "==", profileId),
            orderBy("createdAt", sortType === 'recent' ? "desc" : "asc"),
            startAfter(answerLastDoc),
            limit(7)
          );

          const moreSnapshot = await getDocs(moreQ);
          setAnswers((prevAnswers) => [
            ...prevAnswers,
            ...moreSnapshot.docs.map(
              (doc) => ({ id: doc.id, ...doc.data() } as AnswerType)
            ),
          ]);
          const lastdoc = moreSnapshot.docs[moreSnapshot.docs.length - 1];
          if (lastdoc) setAnswerMorePosts(true);
          else setAnswerMorePosts(false);
          setAnswerLastDoc(lastdoc);
        }
      }else if (postType == "forumPosts") {
        if (answerStart) {
          q = query(
            collection(db, "forumPosts"),
            where("uid", "==", profileId),
            orderBy("createdAt", sortType === 'recent' ? "desc" : "asc"),
            limit(7)
          );
          const snapshot = await getDocs(q);
          setforumPosts(
            snapshot.docs.map(
              (doc) => ({ id: doc.id, ...doc.data() } as ForumPostType)
            )
          );
          const lastdoc = snapshot.docs[snapshot.docs.length - 1];
          if (lastdoc) setForumPostLastDoc(true);
          else setForumPostMorePosts(false);
          setForumPostLastDoc(lastdoc);
          setForumPostStart(false);
        } else {
          const moreQ = query(
            collection(db, "forumPosts"),
            where("uid", "==", profileId),
            orderBy("createdAt", sortType === 'recent' ? "desc" : "asc"),
            startAfter(foumPostLastDoc),
            limit(7)
          );

          const moreSnapshot = await getDocs(moreQ);
          setforumPosts((prevforumPosts) => [
            ...prevforumPosts,
            ...moreSnapshot.docs.map(
              (doc) => ({ id: doc.id, ...doc.data() } as ForumPostType)
            ),
          ]);
          const lastdoc = moreSnapshot.docs[moreSnapshot.docs.length - 1];
          if (lastdoc) setForumPostMorePosts(true);
          else setForumPostMorePosts(false);
          setForumPostLastDoc(lastdoc);
        }
      }
      setLoadingPosts(false);
    } catch (error) {
      console.error("Error fetching data:", error);
      setLoadingPosts(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [profileId, postType, loadMore, reload]);

  const handleToggleSwitchNormal = () => {
    setStart(true);
    setIsAnonymous(false);
    setPostType('normal');
  };

  const handleToggleSwitchForumP = () => {
    setForumPostStart(true);
    setIsForumPosts(true);
    setPostType('forumPosts');
  };

  const handleToggleSwitchAnonymous = () => {
    setAnonymousStart(true);
    setIsAnonymous(true);
    setPostType('anonymous');
  };

  const handleToggleSwithcAnswers = () => {
    setAnswerStart(true);
    setIsAnswers(true);
    setPostType('answers');
  };

  const handleLoadMore = () => {
    setLoadMore((prev) => !prev);
  };

  //for lazy loading functionality
  useEffect(() => {
    if (morePosts || anonymousMorePosts || answerMorePosts || forumPostMorePosts) {
      const observer = new IntersectionObserver(
        (entries) => {
          if (entries[0].isIntersecting) {
            handleLoadMore();
          }
        },
        { threshold: 1 }
      );

      if (loadMoreButtonRef.current) {
        observer.observe(loadMoreButtonRef.current);
      }

      return () => {
        if (loadMoreButtonRef.current) {
          observer.unobserve(loadMoreButtonRef.current);
        }
      };
    }
  }, [loadMoreButtonRef, handleLoadMore, morePosts, anonymousMorePosts]);

  const handleSortChange = () => {
    setStart(true);
    setAnonymousStart(true);
    setQuestions([]);
    setAnonymousQuestions([]);
    setAnswers([]);
    setAnswerStart(true);
    setforumPosts([]);
    setForumPostStart(true);
    setReload((prev) => !prev);
  };

  if (loading) {
    return <Loader />;
  } else {
    return (
      <div className='md:container md:max-w-[84rem] md:mx-auto mt-3'>
        <ProfileCard user={{ uid: profileId }} />
        <div className='toggleSwitch mt-2 overflow-auto'>
          <Tabs defaultValue="posts" className="w-full">
            <TabsList className="grid gap-2 grid-cols-3 w-[600px]">
              <TabsTrigger value="posts" onClick={handleToggleSwitchNormal}>Posts</TabsTrigger>
              <TabsTrigger value="answers" onClick={handleToggleSwithcAnswers}>Answers</TabsTrigger>
              <TabsTrigger value="forumPosts" onClick={handleToggleSwitchForumP}>Forum Posts</TabsTrigger>
              {/* <TabsTrigger value="anonymous" onClick={handleToggleSwitchAnonymous}>Anonymous</TabsTrigger> */}
            </TabsList>
          </Tabs>
        </div>

        {(postType == 'normal' || postType == 'anonymous' || postType == 'answers' || postType=='forumPosts') &&
          <div className="bg-section border-y-[1px] border-black border-opacity-15 py-2 flex justify-between items-center">
            <div className="font-style-6 opacity-80 ml-2">
              {postType == 'normal' ? <div>Posts</div> : postType == 'anonymous' ? <div>Anonymous</div> : postType=="answers"? <div>Answers</div>:<div>Forum Posts</div>}
            </div>
            <div className="mr-2">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <div className="font-style-6 flex items-center gap-1 cursor-pointer opacity-75 rounded-md p-1 hover:bg-slate-200">{sortType == 'recent' ? "Most Recent" : "Oldest"}<span><FaChevronDown /></span></div>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-20">
                  <DropdownMenuGroup>
                    <DropdownMenuItem onClick={() => { setSortType('recent'); handleSortChange() }}>
                      Most Recent
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => { setSortType('oldest'); handleSortChange() }}>
                      Oldest
                    </DropdownMenuItem>
                  </DropdownMenuGroup>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        }

        <div>
          <div>
            {postType == 'anonymous' ? (
              <div>
                {anonymousQuestions?.length === 0
                  ? !loadingPosts && (
                    <div className="flex items-center justify-center flex-col mt-5 w-full">
                      <Image
                        src="/trash.png"
                        width={300}
                        height={300}
                        className="w-[10rem] h-[9rem] rounded-full"
                        alt="Profile Pic"
                      />
                      <h1 className="text-2xl">No posts yet</h1>
                    </div>
                  )
                  : anonymousQuestions &&
                  anonymousQuestions.map((post, index) => (
                    <div key={index} className="my-1">
                      <Post post={post} isProfile={true} />
                    </div>
                  ))}
              </div>
            ) : postType == 'normal' ? (
              <div>
                {questions?.length === 0 ? (
                  !loadingPosts && (
                    <div className="flex items-center justify-center flex-col mt-5 w-full">
                      <Image
                        src="/trash.png"
                        width={300}
                        height={300}
                        className="w-[10rem] h-[9rem] rounded-full"
                        alt="Profile Pic"
                      />
                      <h1 className="text-2xl">No posts yet</h1>
                    </div>
                  )
                ) : (
                  questions && postType === "normal" &&
                  questions.map((post, index) => (
                    <div key={index} className="my-1">
                      <Post post={post} isProfile={true} othersProfile={true}/>
                    </div>
                  ))
                )}
              </div>
            ) : (
              <div>
                {postType == 'answers' ? (
                  <div>
                    {answers?.length === 0 ? (
                      !loadingPosts && (
                        <div className="flex items-center justify-center flex-col mt-5 w-full">
                          <Image
                            src="/trash.png"
                            width={300}
                            height={300}
                            className="w-[10rem] h-[9rem] rounded-full"
                            alt="Profile Pic"
                          />
                          <h1 className="text-2xl">No posts yet</h1>
                        </div>
                      )
                    ) : (
                      answers && postType === "answers" &&
                      answers.map((post, index) => (
                        <div key={index} className="my-1">
                          <AnswerPost post={post} isProfile={true} othersProfile={true} />
                        </div>
                      ))
                    )}
                  </div>
                ):(<div>

                  {
                    postType=="forumPosts"&&(
                      <div>
<div>
                    {forumPosts?.length === 0 ? (
                      !loadingPosts && (
                        <div className="flex items-center justify-center flex-col mt-5 w-full">
                          <Image
                            src="/trash.png"
                            width={300}
                            height={300}
                            className="w-[10rem] h-[9rem] rounded-full"
                            alt="Profile Pic"
                          />
                          <h1 className="text-2xl">No posts yet</h1>
                        </div>
                      )
                    ) : (
                      forumPosts && postType === "forumPosts" &&
                      forumPosts.map((post, index) => (
                        <div key={index} className="my-1">
                          <ForumPost post={post} isProfile={true} />
                        </div>
                      ))
                    )}
                  </div>
                      </div>
                    )
                  }
                  
                </div>)}
              </div>
            )}
          </div>
        </div>

        <div>
          {(postType == 'normal' || postType == 'anonymous' || postType == 'answers' || postType=='forumPosts') &&
            <div className="flex items-center justify-center">
              {loadingPosts ? (
                <div>
                  <Loader />
                </div>
              ) : (
                <div className="mt-2 mb-5">
                  {isAnonymous ? (
                    anonymousMorePosts ? (
                      <div ref={loadMoreButtonRef}>
                        <button onClick={handleLoadMore}></button>
                      </div>
                    ) : (
                      <div>No More Posts...</div>
                    )
                  ) : (
                    isAnswers ? (
                      answerMorePosts ? (
                        <div ref={loadMoreButtonRef}>
                          <button onClick={handleLoadMore}></button>
                        </div>
                      ) : (
                        <div>No More Posts...</div>
                      )
                    ) : (
                      isForumPosts?(
                        forumPostMorePosts?(
                          <div ref={loadMoreButtonRef}>
                          <button onClick={handleLoadMore}></button>
                        </div>
                        ):(
                          <div>No More Posts...</div>
                        )
                      ):(
                        morePosts ? (
                          <div ref={loadMoreButtonRef}>
                            <button onClick={handleLoadMore}></button>
                          </div>
                        ) : (
                          <div>No More Posts...</div>
                        )
                      )
                    )
                  )}
                </div>
              )}
            </div>
          }
        </div>
      </div>
    );
  }
};

export default UserProfilePage;
