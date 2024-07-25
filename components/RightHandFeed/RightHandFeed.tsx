import { RecentPosts } from '@/lib/data'
import React, {useEffect, useState} from 'react'
import { db } from '@/utils/firebase'
import { collection, getDocs, limit, onSnapshot, orderBy, query } from 'firebase/firestore'
import parse from "html-react-parser"

import RightHandFeedCard from './RightHandFeedCard'
import { Separator } from '../ui/separator'
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card'
import { Button } from '../ui/button'

type Props = {}

type PostType = {
  id: string;
  name: string;
  title: string;
  profilePic: string;
  description: string;
  voteAmt: number;
  comments: number;
  createdAt: string;
  anonymity: boolean;
  // Add any other fields as necessary
}

const RightHandFeed = (props: Props) => {

  const [posts , setPosts] = useState<PostType[]>([]);

  //fetching questions
  useEffect(() => {

    const collectionRef = collection(db, 'questions');
    const q = query(collectionRef, orderBy('createdAt', 'desc'), limit(5));

    const unsub = onSnapshot(q, async(snapshot) => {
      const postsData =[];

      for (const doc of snapshot.docs) {
        
        // Fetch the 'answers' subcollection for each question
        const answersCollectionRef = collection(doc.ref, 'answers');
        const answersQuery = query(answersCollectionRef);
    
        const answersSnapshot = await getDocs(answersQuery);
        const numAnswers = answersSnapshot.size;
    
        // Add the total number of answers to the question data
        const questionData = { id: doc.id, comments: numAnswers, ...doc.data() } as PostType;
    
        postsData.push(questionData);
      }
  
      //console.log(postsData)
      setPosts(postsData);
    })

    return () => {
      unsub()
    }
  }, [])

  return (
<div>
    <div className='bg-white dark:bg-black rounded-2xl shadow-[0px_0px_0px_1px_rgba(8,112,184,0.06),0px_1px_1px_-0.5px_rgba(8,112,184,0.06),0px_3px_3px_-1.5px_rgba(8,112,184,0.06),_0px_6px_6px_-3px_rgba(8,112,184,0.06),0px_12px_12px_-6px_rgba(8,112,184,0.06),0px_24px_24px_-12px_rgba(8,112,184,0.06)]'>
          <Card x-chunk="dashboard-01-chunk-5" className='rounded-2xl'>
              <CardHeader className='text-sm pb-1'>
                <CardTitle className="text-[19px] dark:bg-black  dark:text-white font-[700]">Ask Question</CardTitle>
              </CardHeader>
              <CardContent className="mt-2">
                <p className=' text-[14px] dark:text-zinc-50/70'>Enrich your Spiritual journey with TheGodSays.</p>
                <div className=' flex items-end justify-end mt-4'>
                <Link href={'/createQue'} className='w-full'>
                  <Button className=' w-full font-style-4'><a target='_blabk' href="#">Ask Question</a></Button>
                  </Link>
                </div>
              </CardContent>
          </Card>
          </div>
    <div className='max-h-[40rem] p-2 mt-[13px] overflow-auto bg-[#FFFFFF] rounded-2xl dark:bg-[#262626] shadow-[0px_0px_0px_1px_rgba(8,112,184,0.06),0px_1px_1px_-0.5px_rgba(8,112,184,0.06),0px_3px_3px_-1.5px_rgba(8,112,184,0.06),_0px_6px_6px_-3px_rgba(8,112,184,0.06),0px_12px_12px_-6px_rgba(8,112,184,0.06),0px_24px_24px_-12px_rgba(8,112,184,0.06)]'>

<Table>
      <TableHeader>
        <TableRow>
          <TableHead className="text-left font-bold text-[20px] dark:text-white text-[#000000]">Recent Posts</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {posts.map((post, index) => (
          <TableRow key={index}>
            <Link className='flex flex-col' href={`/${encodeURIComponent(post?.title?.split(" ").join("-"))}`}>
            <TableCell className="font-style-2 font-[500]">{post.title.length>70?post.title.substring(0, 69)+"...":post.title}</TableCell>
            <TableCell className="font-style-1-descriptions text-zinc-500 dark:text-gray-400">{post.description.length>1000?parse(post.description.substring(0, 99))+"...":parse(post.description)}</TableCell>
            </Link>
            {
              index!=4&&
            <Separator/>
            }
          </TableRow>
        ))}
      </TableBody>
      {/* <TableFooter>
        <TableRow>
          <TableCell>Ask Question...</TableCell>
        </TableRow>
      </TableFooter> */}
      </Table>


    </div>
    </div>
  )
}

export default RightHandFeed