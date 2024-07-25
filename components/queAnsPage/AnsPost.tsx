"use client";

import React, { useRef, useState, useEffect } from "react";
import parse from "html-react-parser";

import { Key, MessageSquare } from "lucide-react";
import { Share } from "lucide-react";
import { Bookmark } from "lucide-react";

import Link from "next/link";
import Image from "next/image";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import PostVoteClient from "@/components/post-vote/PostVoteClient";
import ShareDialog from "../ShareDialog";
import { useParams } from "next/navigation";
import CommentBox from "./CommentBox";
import PostVoteClientPhone from "../post-vote/PostVoteClientPhone";
import Loader from "../ui/Loader";
import { useToast } from "@/components/ui/use-toast";

import { auth, db } from "@/utils/firebase";
import { useAuthState } from "react-firebase-hooks/auth";
import {
  arrayRemove,
  arrayUnion,
  collection,
  doc,
  getDoc,
  getDocs,
  limit,
  orderBy,
  query,
  startAfter,
  updateDoc,
  where,
} from "firebase/firestore";

type Props = {
  answers: {
    id: string;
    name: string;
    profilePic: string;
    description: string;
    likes: number;
    comments: number;
    shares: number;
    answerImageURL: string;
    createdAt: any;
    anonymity: boolean;
  }[];
  postTitleWithSpaces: string;
  postId: string;
};

type AnswerType = {
  id: string;
  name: string;
  description: string;
  profilePic: string;
  likes: number;
  comments: number;
  shares: number;
  answerImageURL: string;
  createdAt: any;
  anonymity: boolean;
  questionId: string;
  questionTitle: string;
};

const AnsPost = ({ answers, postTitleWithSpaces, postId }: Props) => {
  const { toast } = useToast();
  const [user] = useAuthState(auth);
  const [followedUsers, setFollowedUsers] = useState<string[]>([]);
  const [loadingFollowedUsers, setLoadingFollowedUsers] = useState(false);
  const [lastAnswer, setLastAnswer] = useState<AnswerType | null>(null);
  const [loading, setLoading] = useState(false);
  const [dispAnswer, setDispAnswer] = useState<AnswerType[]>(
    [] as AnswerType[]
  );
  const [moreAnswers, setMoreAnswers] = useState(false);
  const answersContainerRef = useRef<HTMLDivElement | null>(null);
  const pRef = useRef<HTMLDivElement>(null);
  const loadMoreButtonRef = useRef<HTMLButtonElement>(null);
  const [commentInputVisibility, setCommentInputVisibility] = useState(
    answers.map(() => false)
  );
  const [commentAdded, setCommentAdded] = useState(false);

  const toggleCommentInputVisibility = (index: number) => {
    setCommentInputVisibility((prevVisibility) =>
      prevVisibility.map((isVisible, i) =>
        i === index ? !isVisible : isVisible
      )
    );
  };

  useEffect(() => {
    setCommentInputVisibility(answers.map(() => false));
  }, [answers]);

  //fetching answers of the question
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);

      if (postId) {
        const ansQuery = query(
          collection(db, "answers"),
          where("questionTitle", "==", postTitleWithSpaces),
          orderBy("createdAt", "desc"),
          limit(5)
        );

        const ansSnapshot = await getDocs(ansQuery);
        if (!ansSnapshot.empty) {
          const newAnswers = await Promise.all(
            ansSnapshot.docs.map(async (doc) => {
              const answerData = doc.data() as AnswerType;
              const commentsQuery = collection(
                db,
                "answers",
                doc.id,
                "comments"
              );
              const commentsSnapshot = await getDocs(commentsQuery);

              let totalComments = commentsSnapshot.size;
              let totalReplies = 0;

              for (const commentDoc of commentsSnapshot.docs) {
                const replies = commentDoc.data().replies || [];
                totalReplies += replies.length;
              }

              return {
                ...answerData,
                id: doc.id,
                comments: totalComments + totalReplies,
              };
            })
          );

          setDispAnswer(newAnswers);
          setLastAnswer(newAnswers[newAnswers.length - 1]);
          setMoreAnswers(newAnswers.length >= 5);
        }
      }

      setLoading(false);
    };

    fetchData();
  }, [postId, answers, commentAdded]);

  //fetching followers data
  useEffect(() => {
    const fetchFollowedUsers = async () => {
      if (!user) return;

      setLoadingFollowedUsers(true);
      const userRef = doc(db, "users", user.uid);
      const userDoc = await getDoc(userRef);

      if (userDoc.exists()) {
        const userData = userDoc.data();
        const followed = userData?.following || [];
        setFollowedUsers(followed);
      }

      setLoadingFollowedUsers(false);
    };

    fetchFollowedUsers();
  }, [user]);

  //to follow user
  const followUser = async (userId: string) => {
    if (!user || (user && user.isAnonymous == true)) {
      toast({
        title: " Please login to follow others ",
        variant: "destructive",
      });
      return;
    }

    const userRef = doc(db, "users", user.uid);
    await updateDoc(userRef, {
      following: arrayUnion(userId),
    });

    setFollowedUsers((prevFollowed) => [...prevFollowed, userId]);
    toast({
      title: "You are now following this user ✅",
      variant: "default",
    });
  };

  //for unfollowing user
  const unfollowUser = async (userId: string) => {
    if (!user || (user && user.isAnonymous == true)) {
      toast({
        title: " Please login to follow others ",
        variant: "destructive",
      });
      return;
    }

    const userRef = doc(db, "users", user.uid);
    await updateDoc(userRef, {
      following: arrayRemove(userId),
    });

    setFollowedUsers((prevFollowed) =>
      prevFollowed.filter((id) => id !== userId)
    );
    toast({
      title: "You have unfollowed this user ❌",
      variant: "default",
    });
  };

  const isUserFollowed = (userId: string) => followedUsers.includes(userId);

  //loadmore function for answers
  const loadMoreAnswers = async () => {
    setLoading(true);

    let ansQuery = query(
      collection(db, "answers"),
      where("questionTitle", "==", postTitleWithSpaces),
      orderBy("createdAt", "desc"),
      startAfter(lastAnswer ? lastAnswer.createdAt : null),
      limit(5)
    );

    const ansSnapshot = await getDocs(ansQuery);
    if (ansSnapshot.docs.length <= 0) {
      setMoreAnswers(false);
    } else setMoreAnswers(true);

    if (!ansSnapshot.empty) {
      const newAnswers = await Promise.all(
        ansSnapshot.docs.map(async (doc) => {
          const answerData = doc.data() as AnswerType;
          const commentsQuery = collection(db, "answers", doc.id, "comments");
          const commentsSnapshot = await getDocs(commentsQuery);

          let totalComments = commentsSnapshot.size;
          let totalReplies = 0;

          for (const commentDoc of commentsSnapshot.docs) {
            const replies = commentDoc.data().replies || [];
            totalReplies += replies.length;
          }

          return {
            ...answerData,
            id: doc.id,
            comments: totalComments + totalReplies,
          };
        })
      );

      setDispAnswer((prevAnswers) => [...prevAnswers, ...newAnswers]);
      setLastAnswer(newAnswers[newAnswers.length - 1]);
      setMoreAnswers(newAnswers.length >= 5);
    }

    setLoading(false);
  };

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          loadMoreAnswers();
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
  }, [loadMoreButtonRef, loadMoreAnswers]);

  return (
    <div className="mt-3 font-dmsans">
      {dispAnswer.length > 0 &&
        dispAnswer.map((answer: any, key) => (
          <div
            key={answer.id}
            className="rounded-2xl bg-white dark:bg-[#262626] my-3 space-y-0 break-words overflow-hidden shadow-[0px_0px_0px_1px_rgba(8,112,184,0.06),0px_1px_1px_-0.5px_rgba(8,112,184,0.06),0px_3px_3px_-1.5px_rgba(8,112,184,0.06),_0px_6px_6px_-3px_rgba(8,112,184,0.06),0px_12px_12px_-6px_rgba(8,112,184,0.06),0px_24px_24px_-12px_rgba(8,112,184,0.06)]"
          >
            <div className="px-6 py-5 flex justify-between">
              <div className="w-0 flex-1">
                <div className="flex justify-between max-h-40 mt-1 space-x-2 text-xs">
                  <div className="flex gap-3">
                  <Avatar>
                    <div className="relative w-full h-full aspect-square">
                      <Image
                        fill
                        src={
                          answer.anonymity
                            ? "https://e7.pngegg.com/pngimages/416/62/png-clipart-anonymous-person-login-google-account-computer-icons-user-activity-miscellaneous-computer.png"
                            : answer.profilePic
                        }
                        alt="profile picture"
                        referrerPolicy="no-referrer"
                      />
                    </div>
                  </Avatar>
                  <span className="font-style-5-username mt-3 text-[#0c0c0c] text-sm font-semibold dark:text-white">
                    {answer.anonymity ? (
                      "Anonymous"
                    ) : (
                      <Link
                        className="hover:underline cursor-pointer"
                        href={`/profile/${answer.uid}`}
                      >
                        {answer.name}
                      </Link>
                    )}
                  </span>
                  {answer.anonymity ||
                  !user ||
                  answer.uid === user.uid ? null : (
                    <div className="flex space-x-1 mr-5">
                      <svg
                        viewBox="0 0 48 48"
                        className="mt-[1.20rem] mr-1 w-1 h-1"
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
                          <path
                            d="M24 36C30.6274 36 36 30.6274 36 24C36 17.3725 30.6274 12 24 12C17.3726 12 12 17.3725 12 24C12 30.6274 17.3726 36 24 36Z"
                            fill="#333333"
                          ></path>
                        </g>
                      </svg>
                      <div>
                        <button
                          className="mt-[0.87rem] p-0 hover:underline cursor-pointer"
                          onClick={() =>
                            isUserFollowed(answer.uid)
                              ? unfollowUser(answer.uid)
                              : followUser(answer.uid)
                          }
                        >
                          <span className="sm:block hidden font-style-5-username text-blue-500">
                            {isUserFollowed(answer.uid)
                              ? "Following"
                              : "Follow"}
                          </span>
                        </button>
                      </div>
                    </div>
                  )}
                  </div>
                  <div className="mt-[11px] font-style-4">{answer?.createdAt?.toDate()?.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</div>
                </div>
                {answer.answerImageURL ? (
                  <div className="relative w-full h-[400px] mt-2">
                    <Image
                      src={answer.answerImageURL}
                      className="rounded-md"
                      layout="fill"
                      alt="answer image"
                      objectFit="contain"
                    />
                  </div>
                ) : null}
                <div
                  className="relative text-base max-h-50 dark:text-white w-full mt-2"
                  ref={pRef}
                >
                  <p className="ProseMirror font-style-3">
                    {answer.description ? parse(answer.description) : ""}
                  </p>
                </div>
              </div>
            </div>
            <div className="dark:bg-[#1A1A1B]/65 z-20 flex justify-between gap-x-3 text-sm px-4 py-4 sm:px-6">
              <PostVoteClientPhone
                postId={answer.id}
                postType="answers"
                userId={user?.uid!}
                questionId={postId}
              />
              <div className="flex gap-x-3">
                <button
                  className="w-fit flex items-center gap-2"
                  onClick={() => toggleCommentInputVisibility(key)}
                >
                  <MessageSquare className="h-4 w-4" />{" "}
                  <span className="sm:block hidden font-style-3">
                    {answer.comments} Comments
                  </span>
                </button>
                <button className="w-fit flex items-center gap-2">
                <ShareDialog postLink={`/${postTitleWithSpaces.split(" ").join("-")}`}/>
                </button>
                <button className="w-fit flex items-center gap-2">
                  <Bookmark className="h-4 w-4" />{" "}
                  <span className="sm:block hidden font-style-4">Save</span>
                </button>
              </div>
            </div>
            {commentInputVisibility[key] && (
              <CommentBox
                postTitleWithSpaces={postTitleWithSpaces}
                changeHandler={setCommentAdded}
                answerId={answer.id}
                toggleCommentInputVisibility={() =>
                  toggleCommentInputVisibility(key)
                }
              />
            )}
          </div>
        ))}
      <div className="flex justify-center py-6">
        {loading ? (
          <div>
            <Loader />
          </div>
        ) : moreAnswers ? (
          <button
            className="mb-2"
            onClick={loadMoreAnswers}
            disabled={loading}
            ref={loadMoreButtonRef}
          ></button>
        ) : (
          <div>No More Answers...</div>
        )}
      </div>
    </div>
  );
};

export default AnsPost;
