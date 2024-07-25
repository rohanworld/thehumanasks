"use client";

import { db } from "@/utils/firebase";
import {
  arrayRemove,
  arrayUnion,
  collection,
  doc,
  getDoc,
  getDocs,
  increment,
  onSnapshot,
  query,
  setDoc,
  updateDoc,
  where,
} from "firebase/firestore";
import Link from "next/link";
import { useRouter } from "next/navigation";
//import parse from "html-react-parser"
import Image from "next/image";
import React, { useEffect, useState } from "react";
import { SubRedditPost } from "./components/subredditPost";
import parse from "html-react-parser";
import { Avatar } from "@/components/ui/avatar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AvatarFallback } from "@radix-ui/react-avatar";
import { useDispatch } from "react-redux";
import { setForumURL } from "@/store/slice";
import ForumsPostFeed from "../../../components/ForumsPostFeed";
import { useAuthState } from "react-firebase-hooks/auth";
import { auth } from "@/utils/firebase";
import { useToast } from "@/components/ui/use-toast";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import Loader from "@/components/ui/Loader";
import BannerF from "../../../public/oppenheimer.jpg"

type Props = {
  params: {
    forumUrl: string;
  };
};

const ForumsPage = ({ params: { forumUrl } }: Props) => {
  const [forumDetails, setForumDetails] = useState<any>({});
  const [memberDetails, setMemberDetails] = useState<any>([]);
  const [joined, setForumJoin] = useState(false);
  const router = useRouter();
  const dispatch = useDispatch();
  const [rerun, setRerun] = useState(false);
  const { toast } = useToast();
  //const joined = false;
  let dateString;
  if (forumDetails.createdAt) {
    const date = forumDetails.createdAt.toDate();
    dateString = date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  }

  const [user, loading] = useAuthState(auth);

  //setting forum url of the current forum
  useEffect(() => {
    const devotionalforumUrl = sessionStorage.getItem("devotionalforumUrl");

    if (!devotionalforumUrl) {
      sessionStorage.setItem("devotionalforumUrl", forumUrl);
    } else {
      sessionStorage.setItem("devotionalforumUrl", forumUrl);
    }
  }, []);

  useEffect(() => {
    isJoined();
  }, [rerun, user]);

  //fetching members details
  useEffect(() => {
    const fetchMemberDetails = async () => {
      if (forumDetails) {
        const allUids = [forumDetails.uid, ...(forumDetails.members || [])];
        const uniqueUids = Array.from(new Set(allUids)); // Convert Set back to array

        const memberPromises = uniqueUids.map(async (uid) => {
          const userRef = doc(db, "users", uid);
          const userSnap = await getDoc(userRef);

          if (userSnap.exists()) {
            return { uid, ...userSnap.data() };
          } else {
            console.error(`User document for UID ${uid} not found.`);
            return null;
          }
        });

        const members = await Promise.all(memberPromises);
        setMemberDetails(members.filter((member) => member !== null));
      }
    };

    fetchMemberDetails();
    console.log(memberDetails);
  }, [forumDetails]);

  const isJoined = async () => {
    const forumQuery = query(
      collection(db, "forums"),
      where("uniqueForumName", "==", forumUrl)
    );

    const forumSnapshot = await getDocs(forumQuery);

    if (forumSnapshot.empty) {
      console.error("Forum not found.");
      return;
    }

    const forumDoc = forumSnapshot.docs[0];
    const forumRef = doc(db, "forums", forumDoc.id);

    const docSnap = await getDoc(forumRef);

    if (docSnap.exists()) {
      const forumData = docSnap.data();
      if (user) {
        const members = forumData.members || [];
        const userIndex = members.indexOf(user.uid);

        //console.log("UserId", user.uid);

        if (userIndex !== -1 || forumData.uid == user.uid) {
          setForumJoin(true);
        } else {
          setForumJoin(false);
        }
      }
    }
  };

  //function to join unjoin forum
  const joinInForum = async () => {
    //setForumJoin((prev)=>!prev);
    const forumQuery = query(
      collection(db, "forums"),
      where("uniqueForumName", "==", forumUrl)
    );

    try {
      const forumSnapshot = await getDocs(forumQuery);

      if (forumSnapshot.empty) {
        console.error("Forum not found.");
        return;
      }

      const forumDoc = forumSnapshot.docs[0];
      const forumRef = doc(db, "forums", forumDoc.id);

      const docSnap = await getDoc(forumRef);

      if (docSnap.exists()) {
        const forumData = docSnap.data();
        if (user) {
          if (forumData.uid == user.uid) {
            toast({
              title: "You can't leave your own server",
              variant: "destructive",
            });
            return;
          }

          const members = forumData.members || [];
          const userIndex = members.indexOf(user.uid);
          let updateData;

          if (userIndex !== -1) {
            // User exists in members array, remove them
            updateData = {
              members: arrayRemove(user.uid),
              noOfMembers: increment(-1),
            };
          } else {
            // User does not exist in members array, add them
            updateData = {
              members: arrayUnion(user.uid),
              noOfMembers: increment(1),
            };
          }

          await updateDoc(forumRef, updateData);
        }

        console.log("Members and noOfMembers updated successfully.");

        //logic to add user in forums

        console.log("NumOfMembers updated successfully.");
        // toast({
        //   title: "Forum Updated",
        //   description: "NumOfPosts updated successfully.",
        // });

        // router.push("/forums");
        setRerun((prev) => !prev);
      } else {
        console.error("Forum document not found.");
      }
    } catch (error) {
      console.error("Error updating document: ", error);
    }
  };

  //fetching forum details
  useEffect(() => {
    const eventRef = collection(db, "forums");
    //console.log("FU: ", forumUrl);
    const q = query(eventRef, where("uniqueForumName", "==", forumUrl));

    const eventsUnsub = onSnapshot(q, (snapshot) => {
      if (!snapshot.empty) {
        const doc = snapshot.docs[0];
        const data = doc.data();
        setForumDetails(data);

        return () => {
          eventsUnsub();
        };
      } else {
        console.log("No such event found");
        router.push("/404");
      }
    });
  }, [forumUrl, router, joined]);

  let descriptionF=forumDetails.description
    ? parse(forumDetails.description)
    : "N/A"

  return (
    <div>
      {/* <div className="w-full h-[10rem] relative border-white border-[3px]">
        <div className="w-full h-full">
          <Image
            fill
            src={
              forumDetails.bannerImageURL == null
                ? "https://static.vecteezy.com/system/resources/thumbnails/000/701/690/small/abstract-polygonal-banner-background.jpg"
                : forumDetails.bannerImageURL
            }
            alt="profile picture"
            referrerPolicy="no-referrer"
          />
        </div>
      </div> */}
      <div className="bg-layout h-18 mb-[11px] h-[280px] ">
      <div className="block md:w-full relative">
      <Image
      className="h-[21rem] w-full"
      src={
        forumDetails.bannerImageURL == null
          ? BannerF
          : forumDetails.bannerImageURL
      }
      alt="banner image"
      width={700}
      height={700}
      />
      </div>
        <div className="mx-auto flex">
          {/* <div className="w-16 absolute h-16 bottom-6 rounded-full bg-green-400 border-white border-2" /> */}
          {/* <Avatar className="w-24 absolute h-24 bottom-6 rounded-full border-white border-[3px]">
            <div className="">
              <Image
                fill
                src={
                  forumDetails.imageURL == null
                    ? "https://www.adobe.com/content/dam/cc/us/en/creativecloud/design/discover/mascot-logo-design/mascot-logo-design_fb-img_1200x800.jpg"
                    : forumDetails.imageURL
                }
                alt="profile picture"
                referrerPolicy="no-referrer"
              />
            </div>
          </Avatar> */}
          <div className="">
          
          </div>

          <div className="flex flex-col mt-[20px] md:w-full absolute top-[7.5rem] text-white px-[3rem]">
          <div className="flex items-center justify-between mr-2">
            <h4 className="font-style-1-headline font-kumbhsans font-semibold text-[30px]">
              {forumDetails.name}
            </h4>
            <div className="flex">
            
            <div className="ml-[23rem] mb-[7px]">
            {
              user?.isAnonymous==true?
              <Button
              className="font-style-4 focus:outline-none rounded-3xl w-full py-2 px-3 bg-black text-white font-bold border border-gray-600"
              onClick={()=>{
                toast({
                  title: "Login to join Forum",
                  variant: "destructive",
                });
              }}
            >
            Join Forum First
            </Button>:
            <div>  
            {joined ? (
              <Link href={`/createForumPost`}>
                <Button className="font-style-4 focus:outline-none rounded-3xl w-full py-2 px-3 bg-[#373737] text-white font-bold border border-gray-600">
                  CREATE POST
                </Button>
              </Link>
            ) : (
              <Button
                onClick={joinInForum}
                className="font-style-4 focus:outline-none rounded-3xl w-full py-2 px-3 bg-[#373737] text-white font-bold border border-gray-600"
              >
                Join Forum First
              </Button>
            )}
            </div>
}
          </div>
          <div>
            {
              joined&&
              <Button
              className="font-style-4 ml-5 text-sm text-[16px] text-black font-semibold border hover:bg-slate-300 border-gray-600 bg-slate-200 py-0 md:px-3 rounded-3xl focus:outline-none"
              onClick={joinInForum}
            >
            Exit Forum
            </Button>
            }
          </div>
          </div>
          </div>
          <div className="">
          <div className="mt-3 font-style-1-headline font-medium text-[16px] max-w-[72rem]" >
                  {descriptionF}
                </div>
          </div>
          </div>
          
          {/* <p className="ml-[7rem] text-sm">r/{forumDetails.uniqueForumName}</p>
          <div className="flex ml-[7rem] text-sm mt-[2px] font-semibold">
            <div>
              <span className="mr-1">{forumDetails.noOfMembers}</span>
              <span className="text-sm">Members</span>
            </div>
            <div className="ml-3">
              <span className="mr-1">{forumDetails.numOfPosts || 0}</span>
              <span className="text-sm">total Posts</span>
            </div>
          </div> */}
          
        </div>
      </div>
      <div className="bg-section md:flex container mx-auto py-[11px] px-0 md:items-start items-center justify-center md:space-x-[2rem] md:mt-[4rem]">

        {/* Left Column (Posts) */}
        <div className="bg-section flex justify-center mt-6 md:mt-1 w-[100%] items-center md:mx-auto md:w-3/4 py-3 px-[2rem] rounded-lg bg-[#f5f5f5] dark:bg-[#535252] ">
          <ForumsPostFeed newPost={false} forumURL={forumUrl} />
          {/* {forumPost?.map((post:any, index:any) => (
              <SubRedditPost key={index}/>
            ))} */}
        </div>

        <div className=" flex-col space-y-[2rem] w-[100%] items-center md:mx-auto md:w-1/4 border-0 ">

        <div className="bg-card bg-[#ffffff] dark:bg-[#262626] md:mt-[7px] flex-col space-y-4 md:mr-4 p-4 rounded-lg border-0">
            <p className="font-style-0 text-2xl ">{forumDetails.numOfPosts || 0} Posts</p>
            <p className="font-style-1-descriptions">Join the conversation and share your thoughts. Find insights from professionals.</p>
          </div>
          
          {/* <div className="bg-[#ffffff] dark:bg-[#262626] md:mt-[7px] flex-col space-y-4 md:mr-4 p-4 rounded-lg border-0">
            
          </div> */}

          <div className="bg-section bg-[#ffffff] mt-[7px] md:mr-4 rounded-lg border-0">
            <div
              className={
                "pb-1 dark:bg-[#262626] bg-[#ffffff] rounded-md shadow-[0px_0px_0px_1px_rgba(8,112,184,0.06),0px_1px_1px_-0.5px_rgba(8,112,184,0.06),0px_3px_3px_-1.5px_rgba(8,112,184,0.06),_0px_6px_6px_-3px_rgba(8,112,184,0.06),0px_12px_12px_-6px_rgba(8,112,184,0.06),0px_24px_24px_-12px_rgba(8,112,184,0.06)]"
              }
            >
              <div className="space-y-4 py-4">
                <div className="px-2">
                  <div className="px-[10px] mb-[10px]">
                <p className="font-style-0">{forumDetails.noOfMembers} Members</p>
                <p className="font-style-1-descriptions mt-2">Many members are interested in this forum and looking for opportunities</p>
                </div>
                  <ScrollArea className="px-1 h-[150px] ">
                    <div className="space-y-1">
                      <div>
                        {memberDetails ? (
                          memberDetails.map((member: any, index: any) => (
                            <div key={index}>
                              <div>
                                <div className="mb-[10px]">
                                  <div className="flex ml-[13px]">
                                    <div>
                                      <Image
                                        src={member.profilePic}
                                        width={250}
                                        height={250}
                                        alt="Conference"
                                        className=" w-10 h-10 rounded-full"
                                      />
                                    </div>
                                    <div className="ml-4 space-y-1">
                                      <p className="font-style-5 text-[17px] font-medium leading-none mt-2">
                                        {member.name}
                                      </p>
                                      {/* <p className="text-[12px] text-muted-foreground">{member.email}</p> */}
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </div>
                          ))
                        ) : (
                          <div>
                            <Loader />
                          </div>
                        )}
                      </div>
                    </div>
                  </ScrollArea>
                </div>
              </div>
            </div>
          </div>
        </div>

        

        {/* >Right Column (sidebar) */}
        {/* <div className="w-1/4 ml-4">
          <div className="bg-white dark:bg-[#262626] rounded-2xl mt-[7px] shadow-[0px_0px_0px_1px_rgba(8,112,184,0.06),0px_1px_1px_-0.5px_rgba(8,112,184,0.06),0px_3px_3px_-1.5px_rgba(8,112,184,0.06),_0px_6px_6px_-3px_rgba(8,112,184,0.06),0px_12px_12px_-6px_rgba(8,112,184,0.06),0px_24px_24px_-12px_rgba(8,112,184,0.06)]">
            <Card
              x-chunk="dashboard-01-chunk-5"
              className="rounded-2xl dark:bg-[#262626]"
            >
              <CardHeader className="text-sm pb-1">
                <CardTitle className="text-[20px] font-[700] bg-transparent dark:text-yellow-50">
                  Forum Description
                </CardTitle>
                <div className="text-xs text-muted-foreground">
                  <span>Created On : {` `}</span>{" "}
                  <span>{dateString && <>{dateString}</>}</span>
                </div>
              </CardHeader>
              <CardContent className="mt-3">
                <p className="text-[21px]">
                  {forumDetails.description
                    ? parse(forumDetails.description)
                    : ""}
                </p>
              </CardContent>
            </Card>
          </div>
        </div> */}
      </div>
    </div>
  );
};

export default ForumsPage;
