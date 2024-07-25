import React from 'react'

import PostFeed from './PostFeed'
import TopFeedCard from './TopFeedCard'

type Props = {
  newPost: boolean
}

const CustomFeed = (props: Props) => {
  //console.log(props.newPost)
  return (
    <div className='bg-layout w-full'>
        {/* <TopFeedCard/> */}
        <div className='text-[20px] font-bold mt-3 font-style-0'>Discussions</div>
        <PostFeed newPost={props.newPost}/>
    </div>
  )
}

export default CustomFeed