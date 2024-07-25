import React, { useEffect, useState } from "react";
import { Suspense } from "react";
import Head from "next/head";
import PostContent from "@/components/PostContent";


type Props = {
  params: {
    postTitle: string;
  };
};



const PostPage = ({ params: { postTitle } }: Props) => {
  

  return (

    <>
     <Head>
        <title>{postTitle}</title>
      </Head>
      <Suspense fallback={<div>Loading...</div>}>
        <PostContent postTitle={postTitle} />
      </Suspense>
    </>
  );
};

export default PostPage;
