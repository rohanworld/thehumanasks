"use client"

import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { db } from "@/utils/firebase";
import { collection, getDocs } from "firebase/firestore";
import { PlusCircleIcon } from "lucide-react";
import Link from "next/link";
import { Suspense, useEffect, useState } from "react";
import parse from "html-react-parser";

//not in use currently
const ForumPage = () => {

    const [forums, setForums] = useState<any>([]);

    useEffect(() => {
        const fetchForums = async () => {
          try {
            const forumsCollection = collection(db, "forums");
            const forumsSnapshot = await getDocs(forumsCollection);
    
            const forumsData:any = [];
            forumsSnapshot.forEach((doc) => {
              // Assuming each forum document has fields like title, description, etc.
              const forumDetails = {
                uniqueForumName: doc.data().uniqueForumName,
                title: doc.data().name,
                description: doc.data().description,
                // Add other fields as needed
              };
              forumsData.push(forumDetails);
            });
    
            setForums(forumsData);
          } catch (error) {
            console.error("Error fetching forums:", error);
          }
        };
    
        fetchForums();
      }, []);

    return (
        <div className="lg:container lg:mx-auto font-dmsans mt-1">
        <div className="">
          <div className="max-w-[22.5rem] ">
        </div>
          <div className="bg-background rounded-md pl-[15px]">
            <div className="">
              <div className="">
                <div className="px-2 py-6 md:w-[63rem] block">
                  <Tabs defaultValue="Webinar" className="h-full space-y-6">
                    <div className="font-style-6-section-header space-between flex items-center">
                      <TabsList>
                        <TabsTrigger value="Webinar" className="relative" >
                          Forum
                        </TabsTrigger>
                        {/* <TabsTrigger value="podcasts">Podcasts</TabsTrigger> */}
                        <TabsTrigger value="Offline" disabled>
                          Other
                        </TabsTrigger>
                      </TabsList>
                      <div className="ml-auto">
                      <div>
              
                      <Link
                      className=""
                    href={"/createForum"}
                    >
                        <Button className=" mr-2">
                          <PlusCircleIcon className="mr-2 h-4 w-4" />
                          Create Forum
                        </Button>
                      </Link>
            </div>
                      </div>
                    </div>
                    <TabsContent
                      value="Webinar"
                      className="border-none p-0 outline-none"
                    >
                      <div className="flex items-center justify-between">
                        <div className="space-y-1">
                          <h2 className="text-xl font-semibold tracking-tight">
                            All Forums
                          </h2>
                          <p className="text-sm text-muted-foreground">
                          Enrich your spiritual journey through TheGodSays. Ask, seek, answer, and grow.
                          </p>
                        </div>
                      </div>
                      <Separator className="my-4" />

                      <div className="flex flex-col">
                          <div className="grid lg:grid-cols-3 md:grid-cols-3 grid-cols-1 gap-[1rem]">
                          <div>
      <ul>
        {forums.map((forum:any, index:number) => (
          <li key={index} className="mb-5">
            <h2 className="font-bold mb-1">{forum.title}</h2>
            <p className="mb-2">{parse(forum.description)}</p>
            <Link href={`/forums/${forum.uniqueForumName}`}>
            <Button>Go to Forum</Button>
            </Link>
            {/* Render other details */}
          </li>
        ))}
      </ul>
    </div>

                            
                          </div>
                      </div>

                    </TabsContent>
                    <TabsContent
                      value="Offline"
                      className="h-full flex-col border-none p-0 data-[state=active]:flex"
                    >
                      <div>Work in Progress</div>
                    </TabsContent>
                  </Tabs>
                </div>
              </div>
            </div>
          </div>
        </div>
        
      </div>
);
}

export default ForumPage;