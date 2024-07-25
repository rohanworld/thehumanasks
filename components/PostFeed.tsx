"use client";

import React, { ChangeEvent, useEffect, useRef, useState } from "react";
import Post from "./Post";
import { postData } from "@/lib/data";
import { setCategoryQ, categoryQ } from "@/store/slice";
import ScrollAnimation from "react-animate-on-scroll";
import { Button } from "./ui/button";
import Loader from "./ui/Loader";

import { db } from "@/utils/firebase";
import {
  collection,
  DocumentData,
  DocumentReference,
  getDocs,
  limit,
  onSnapshot,
  orderBy,
  Query,
  query,
  startAfter,
  where,
} from "firebase/firestore";

import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

import algoliasearch from "algoliasearch/lite";
// import algoliasearch from "algoliasearch";
import { InstantSearch, SearchBox, Hits, Highlight } from "react-instantsearch";
import { Search } from "lucide-react";
import { add, set } from "date-fns";

import { useSelector, useDispatch } from "react-redux";
import { RootState } from "@/store/store";
import { triggerSearch } from "@/store/slice";


import { useAuthState } from "react-firebase-hooks/auth";
import { auth } from "@/utils/firebase";
import { doc  } from "firebase/firestore";

//cache using Redux
import { setPosts , addPosts , selectPosts } from "@/store/slice";

type Props = {
  newPost: boolean;
};

type PostType = {
  id: string;
  name: string;
  title: string;
  description: string;
  profilePic: string;
  postImage: string;
  likes: number;
  shares: number;
  comments: number;
  options: Array<any>;
  questionImageURL: string;
  createdAt: string;
  anonymity: boolean;
  ansNumbers: number;
  uid:string;
  // Add any other fields as necessary
};

const PostFeed = (props: Props) => {

  //  //had to put the following piece of code here due to a bug , that showed the recent saved posts on the top of the page and at it's original place as well , thus twice in the page
  //  const [user, loading] = useAuthState(auth);
  //  const [savedPosts , setSavedPosts] = useState<any>([]);
 
  //  useEffect(() => {
  //    if (user) {
  //      const userRef = doc(db, "users", user.uid);
  //      const unsubscribe = onSnapshot(userRef, (doc) => {
  //        if (doc.exists()) {
  //          const data = doc.data();
  //          setSavedPosts(data.savedPosts || []);
  //        }
  //      });
  //      return unsubscribe;
  //    }
  //  }, [user]);


  // const [posts, setPosts] = useState<PostType[]>([]);
  //replacing the local state with Redux state
  const posts = useSelector(selectPosts);
  const dispatch = useDispatch();
  const categoryPosts = useSelector(categoryQ);


  const limitValue: number = 4;
  const [lastDoc, setLastDoc] = useState<any>(null);
  const [lastDocPoll, setLastDocPoll] = useState<any>(null);
  const [loadMore, setLoadMore] = useState<any>(null);
  const [loadMorePoll, setLoadMorePoll] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [pageLoaded, setPageLoaded] = useState(false);
  const [reload, setReload] = useState(false);
  const [addFirst, setAddFirst] = useState(false);
  const [morePosts, setMorePosts] = useState(true);
  const [pollMorePosts, setPollMorePosts] = useState(true);

  const [selectedCategory, setSelectedCategory] = useState<string | undefined>('all');

  const handleSelectChange = (newValue: string | undefined) => {
    dispatch(setPosts([]));
    setLastDoc(null);
    setMorePosts(true);
    setSelectedCategory(newValue);
    console.log(selectedCategory);
  };

  useEffect(()=>{
    handleSelectChange(categoryPosts);
  }, [categoryPosts])

  //for automating loadmore lazy load button ...
  const loadMoreButtonRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    console.log("Last Doc ", lastDoc);
    setIsLoading(true);
  
    const collectionRef = collection(db, "questions");
    let q:any=null;
  
    if (selectedCategory === "all") {
      if (lastDoc) {
        q = query(
          collectionRef,
          orderBy("createdAt", "desc"),
          startAfter(lastDoc),
          limit(limitValue)
        );
      } else {
        q = query(collectionRef, orderBy("createdAt", "desc"), limit(limitValue));
      }
    } else {
      if (lastDoc) {
        q = query(
          collectionRef,
          where("category", "array-contains", selectedCategory),
          orderBy("createdAt", "desc"),
          startAfter(lastDoc),
          limit(limitValue)
        );
      } else {
        q = query(
          collectionRef,
          where("category", "array-contains", selectedCategory),
          orderBy("createdAt", "desc"),
          limit(limitValue)
        );
      }
    }
  
    // For polls
    let qp:any = null;
    if (pollMorePosts) {
      const collectionRefPolls = collection(db, "polls");
  
      if (selectedCategory === "all") {
        if (lastDocPoll) {
          qp = query(
            collectionRefPolls,
            orderBy("createdAt", "desc"),
            startAfter(lastDocPoll),
            limit(limitValue)
          );
        } else {
          qp = query(collectionRefPolls, orderBy("createdAt", "desc"), limit(limitValue));
        }
      } else {
        if (lastDocPoll) {
          qp = query(
            collectionRefPolls,
            where("category", "array-contains", selectedCategory),
            orderBy("createdAt", "desc"),
            startAfter(lastDocPoll),
            limit(limitValue)
          );
        } else {
          qp = query(
            collectionRefPolls,
            where("category", "array-contains", selectedCategory),
            orderBy("createdAt", "desc"),
            limit(limitValue)
          );
        }
      }
    }
  
    // Fetch data
    const fetchData = async () => {
      const postsData:any = [];
      const unsub = onSnapshot(q, async (snapshot: { docs: string | any[]; }) => {
        if (snapshot.docs.length < limitValue) {
          console.log("Length ", snapshot.docs.length);
          setMorePosts(false);
        } else {
          setMorePosts(true);
        }
        for (const doc of snapshot.docs) {
          // Fetch the 'answers' subcollection for each question
          const answersQuery = query(
            collection(db, "answers"),
            where("questionId", "==", doc.id)
          );
          const answersSnapshot = await getDocs(answersQuery);
          const numAnswers = answersSnapshot.size;
  
          // Add the total number of answers to the question data
          const questionData = {
            id: doc.id,
            comments: numAnswers,
            createdAt: doc.data().createdAt, // Ensure createdAt is present for sorting
            ...doc.data(),
          };
  
          postsData.push(questionData);
        }
  
        const lastDocument = snapshot.docs[snapshot.docs.length - 1];
        setLoadMore(lastDocument);
  
        // Update posts data after fetching from polls if necessary
        if (pollMorePosts && qp) {
          const unsubpoll = onSnapshot(qp, async (snapshot: { docs: string | any[]; }) => {
            if (snapshot.docs.length < limitValue) {
              console.log("Length ", snapshot.docs.length);
              setPollMorePosts(false);
            } else {
              setPollMorePosts(true);
            }
            for (const doc of snapshot.docs) {
              // Add poll data
              const pollsAnswersQuery = query(
                collection(db, "pollsAnswers"),
                where("questionId", "==", doc.id)
              );
              const pollsAnswersSnapshot = await getDocs(pollsAnswersQuery);
              const numAnswers = pollsAnswersSnapshot.size;

              const questionData = {
                id: doc.id,
                comments: numAnswers, // No answers for polls
                createdAt: doc.data().createdAt, // Ensure createdAt is present for sorting
                ...doc.data(),
              };
  
              postsData.push(questionData);
              //console.log("questionDataPollL", postsData);
            }
  
            const lastDocumentPoll = snapshot.docs[snapshot.docs.length - 1];
            setLoadMorePoll(lastDocumentPoll);
  
            // Sort postsData by createdAt before updating the state
            postsData.sort((a:any, b:any) => b.createdAt - a.createdAt);
  
            // Final update to posts data
            if (addFirst && lastDoc == null) {
              dispatch(setPosts(postsData));
              setAddFirst(false);
            } else {
              dispatch(addPosts(postsData));
            }
  
            setIsLoading(false);
            setPageLoaded(true);
          });
  
          return () => {
            unsubpoll();
          };
        } else {
          // Sort postsData by createdAt before updating the state
          postsData.sort((a:any, b:any) => b.createdAt - a.createdAt);
  
          if (addFirst && lastDoc == null) {
            dispatch(setPosts(postsData));
            setAddFirst(false);
          } else {
            dispatch(addPosts(postsData));
          }
  
          setIsLoading(false);
          setPageLoaded(true);
        }
      });
  
      return () => {
        unsub();
      };
    };
  
    fetchData();
  }, [lastDoc, reload, selectedCategory]);
  
  

  const categorySelect = async()=>{
    setPosts([]);
    setLastDoc(null);
    setLastDocPoll(null);
  }


  //algolia stuff (for searching of posts)

  // const [searchText, setSearchText] = useState<string>('');
  const [searchResult, setSearchResult] = useState<any>(null);

  const { searchText, searchTriggered } = useSelector(
    (state: RootState) => state.search
  );
  // const dispatch = useDispatch();    //declared above for storing cache in Redux

  const searchClient = algoliasearch(
    "8XQGGZTFH3",
    "bd743f217017ce1ea457a8febb7404ef"
  );

  const searchIndex = searchClient.initIndex("search_questions");

  // const handleSearchText = (e: ChangeEvent<HTMLInputElement>) => {
  //   e.preventDefault();
  //   setSearchText(e.target.value);
  // }

  const handleSearch = async (queryText: string) => {
    try {
      const result = await searchIndex.search(queryText);
      // console.log(result);
      setSearchResult(result.hits);
    } catch (error) {
      console.log(error);
      setSearchResult(null);
    }
  };

  useEffect(() => {
    //console.log("In Post", props.newPost);
    setAddFirst(true);
    setLastDoc(null);
    setReload((prev) => !prev);
  }, [props.newPost]);

  const loadMoreData = () => {
    setLastDocPoll(loadMorePoll);
    setLastDoc(loadMore);
  };

  useEffect(() => {
    if (searchText === "") {
      setSearchResult(null);
    }
  }, [searchText]);

  useEffect(() => {
    if (searchTriggered) {
      handleSearch(searchText);
      dispatch(triggerSearch());
    }
  }, [searchTriggered]);


  //useEffect for automting lazyload functionality
  useEffect(() => {
    if(morePosts){
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          loadMoreData();
        }
      },
      { threshold: 1 } // 1.0 means that when 100% of the target is visible within the element specified by the root option, the callback is invoked.
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
  }, [loadMoreButtonRef, loadMoreData]);


  //returning the searched results from algoia
  function transformHitToPost(hit: any) {
    return {
      id: hit.objectID, // Algolia provides an unique objectID for each record
      title: hit.title,
      name: hit.name,
      description: hit.description,
      profilePic: hit.profilePic,
      postImage: hit.postImage,
      likes: hit.likes,
      comments: hit.comments,
      options: hit.options,
      shares: hit.shares,
      questionImageURL: hit.questionImageURL,
      createdAt: hit.createdAt,
      anonymity: hit.anonymity,
      uid: hit.uid
      // ansNumbers: hit.ansNumbers,
      // add other necessary fields
    };
  }

  //console.log(posts);
  return (
    <div className=" w-[100%]">
      <div className="relative">
        {searchResult && searchResult.length > 0 ? (
          <ul className="flex flex-col space-y-1">
            {searchResult.map((hit: any) => (
              <li key={hit.objectID}>
                <Post post={transformHitToPost(hit)} />
              </li>
            ))}
          </ul>
        ) : (
          <div className=" w-[100%]">
            <ul className=" flex flex-col col-span-2 space-y-[2px]">
              {posts.map((post, index) => (
                <li key={index}>
                  <Post post={post} />
                </li>
              ))}
            </ul>
            <div className='w-[100]'>
            { isLoading?<Loader/>:pageLoaded&&
            <div ref={loadMoreButtonRef} className='mt-4'>
              <button onClick={loadMoreData}></button>
            </div>
            }
            </div>
            <div className="w-full text-center mt-0">{!isLoading&&!morePosts&&<div>No more Posts...</div>}</div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PostFeed;
