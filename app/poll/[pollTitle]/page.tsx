
import React, { useEffect, useState } from "react";
import Head from "next/head";

import { Suspense } from "react";
import PollContent from "@/components/PollContent";

type Props = {
  params: {
    pollTitle: string;
  };

  // post: {
  //   id: string;
  //   title: string;
  //   name: string;
  //   description: string;
  //   profilePic: string;
  //   postImage: string;
  //   likes: number;
  //   comments: number;
  //   shares: number;
  // };
};

const PollPage = ({ params: { pollTitle } }: Props) => {
  

  return (

    <>
<Head>
        <title>{pollTitle}</title>
      </Head>
      <Suspense fallback={<div>Loading...</div>}>
        <PollContent pollTitle={pollTitle} />
      </Suspense>
    </>
  );
};

export default PollPage;
