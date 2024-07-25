"use client";

import Image from "next/image";
import Link from "next/link";
import React, { useEffect, useState , Suspense } from "react";

import imageCompression from 'browser-image-compression';

import {Home as HomeIcon , Search } from "lucide-react";

import { buttonVariants } from "@/components/ui/button";

import CustomFeed from "@/components/CustomFeed";
import RightHandFeed from "@/components/RightHandFeed/RightHandFeed";
import TopFeedCard from "@/components/TopFeedCard";
import Loader from "@/components/ui/Loader";
import { LuXCircle } from "react-icons/lu";
import TempImage from "../public/Groups.png"
import BgImagee from "../public/BG.png"
import { Tabs, TabsList } from "@/components/ui/tabs";
import { TabsTrigger } from "@/components/ui/tabs";

import {
  signInAnonymously, updateProfile,
} from "firebase/auth";

import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormLabel,
  FormField,
  FormItem,
  FormMessage,
  FormDescription,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/components/ui/use-toast";

import {useForm} from "react-hook-form";
import { Controller } from "react-hook-form";

import { Tiptap } from "@/components/TipTapAns";
import { z } from "zod";
import {zodResolver} from "@hookform/resolvers/zod";
import { QuestionType } from "@/schemas/question";

import { auth , db , storage } from "@/utils/firebase";
import { useAuthState } from "react-firebase-hooks/auth";
import { useRouter , useSearchParams } from "next/navigation";

import { addDoc, arrayUnion, collection, doc, getDoc, getDocs, onSnapshot, serverTimestamp, setDoc, updateDoc } from "firebase/firestore";
import { ref , uploadBytes, uploadBytesResumable , getDownloadURL} from "firebase/storage";
import { DialogClose } from "@radix-ui/react-dialog";

import algoliasearch from "algoliasearch/lite";
// import algoliasearch from "algoliasearch";
import { InstantSearch , SearchBox , Hits, Highlight } from "react-instantsearch";
import Post from "@/components/Post";
import { Sidebar } from "@/components/DesktopSidebar";
import BgImage from "../public/Rectangle 12(2).png"
import { setSearchText, triggerSearch } from "@/store/slice";
import { RootState } from "@/store/store";
import { useDispatch , useSelector } from "react-redux";

type Input = z.infer<typeof QuestionType>;


export default function Home() {

  const router = useRouter();
  const searchParams = useSearchParams();
  const isGuest = searchParams.get('isGuest');
  const [user, loading] = useAuthState(auth);
  const [newPost, setNewPost] = useState(false);
  
  const { toast } = useToast();

  type SelectedCategoriesType = Record<string, string[]>;

  //system image upload stuff
  const [imageUpload , setImageUpload] = useState<File | null>(null);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [progress , setProgress] = useState<number | null>(0);
  const [previewImg, setPreviewImg] = useState<any>(null);
  const [selectC, setSelectC] = useState<any>([]);
  const [selectedCategories, setSelectedCategories] = useState<SelectedCategoriesType>({});
  const [selectedMainCategory, setSelectedMainCategory] = useState('');
  const [subCategoryy, setSubCategoryy] = useState<any>(["SubCategory1", "SubCategory2", "SubCategory3"]);
  const [tempSubCategory, setTempSubCategory] = useState<any>([]);
  const [selectCategory, setSelectCategory] = useState<any>();
  const [selectedSubcategory, setSelectedSubcategory] = useState('');
  const [onFirstVisit, setOnFirstVisit] = useState(false);
  const [isFocused, setIsFocused] = useState(false);

  const [selectedCategory, setSelectedCategory] = useState<string | undefined>('all');

  const handleSelectChange = (newValue: string | undefined) => {
    // setSelectedCategory(newValue);
    if(!selectC.includes(newValue)){
    setSelectC((prev:any)=>{
      return [...prev, newValue]
    })
  }
    console.log(selectC);
  };

  const uploadImage = async(file: any) => {
    if(file == null) return;

    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target) {
          const imageUrl = event.target.result;
          setPreviewImg(imageUrl);
        } else {
          console.error('Error reading file:', file);
          setPreviewImg(null);
        }
      };
      reader.readAsDataURL(file);
    } else {
      setPreviewImg(null);
    }

    const storageRef = ref(storage, `questions/${file.name}`);

    try {
      // Set compression options
    const options = {
      maxSizeMB: 1, // Max size in megabytes
      maxWidthOrHeight: 800, // Max width or height
      useWebWorker: true, // Use web worker for better performance (optional)
    };
  
      // Compress the image
      
      const compressedFile = await imageCompression(file, options);

    //uploading compressed file
    const uploadTask = uploadBytesResumable(storageRef, compressedFile);

    uploadTask.on('state_changed', 
    (snapshot:any) => {
      // You can use this to display upload progress
      const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
      console.log('Upload is ' + progress + '% done');
      setProgress(progress);
    }, 
    (error: any) => {
      // Handle unsuccessful uploads
      console.log('Upload failed', error);
    }, 
    () => {
      // Upload completed successfully, now we can get the download URL
      getDownloadURL(uploadTask.snapshot.ref).then((downloadURL) => {
        console.log('File available at', downloadURL);
        // Save the URL to state or wherever you want to keep it
        setImageUrl(downloadURL);
      });
    }
  );}catch(err){
    console.error('Error compressing or uploading image:', err);
  }

  }

  //category stuff
  //fetching all categories
  useEffect(()=>{
    const getCat=async()=>{
      try {
        const eventCategoriesRef = collection(db, 'meta-data', 'v1', 'event-categories');
        const snapshot = await getDocs(eventCategoriesRef);
    
        const eventCategories:any = [];
        snapshot.forEach(doc => {
          eventCategories.push({ id: doc.id, ...doc.data() });
        });
    
        return eventCategories;
      } catch (error) {
        console.error('Error fetching event categories:', error);
        return [];
      }
  }
  const category = getCat().then(categories => {
    setSelectCategory(categories);
  }).catch(error => {
    console.error('Error:', error);
  });
  }, [])
    
  const handleMainCategoryChange = (newValue: string) => {
    setTempSubCategory([]);
    if(!selectC.includes(newValue)){
      setSelectC((prev:any)=>{
        return [...prev, newValue]
      })
    }
    setSelectedMainCategory(newValue);
    handleCategorySelectChange(newValue, undefined);
  };

  const handleSubcategoryChange = (newValue: string) => {
    if(!tempSubCategory.includes(newValue)){
      setTempSubCategory((prev:any)=>{
        return [...prev, newValue]
      })
    }
    handleCategorySelectChange(selectedMainCategory, newValue);
    setSelectedSubcategory(newValue);
  };

  const handleCategorySelectChange = (category: string, subcategory: string | undefined) => {
    setSelectedCategories((prev: any) => {
      const updatedCategories = { ...prev };
      if (!updatedCategories[category]) {
        updatedCategories[category] = [];
      }
      if (subcategory && !updatedCategories[category].includes(subcategory)) {
        updatedCategories[category].push(subcategory);
      }
      return updatedCategories;
    });
    //console.log(selectedCategories);
  };

  const delCategories = (category:string)=>{
    let newCategory=selectC.filter((cat:any)=>{
      console.log(cat, " ", category);
      return cat!=category;
    })
  setSelectC(newCategory);
  delete selectedCategories[category]
  //console.log(selectedCategories);
  }

  const delSubCategories = (category:string)=>{
    let newSubCategory=tempSubCategory.filter((cat:any)=>{
      return cat!=category;
    })
  setTempSubCategory(newSubCategory);
  selectedCategories[selectedMainCategory]=selectedCategories[selectedMainCategory].filter((subcat)=>(
    subcat!=category
  ))
  //console.log(selectedCategories);
  }

  //for signing out
  const signoutHandler = ()=>{
    auth.signOut();
    if(user?.isAnonymous){
    router.push("/auth");
    }
  }

  //for signing in as guest
  const signingInAnonymously = async () => {

    // guests should not be able to post questions
    // const isGuest = true;

    // Generate a unique 4-digit number
    const uniqueNumber = Math.floor(1000 + Math.random() * 9000);

    await signInAnonymously(auth)
      .then(async (userCredential) => {
        const user = userCredential.user;
        // console.log(user);
        // Update user's profile
        await updateProfile(user, {
          // displayName: anonymousUserName, // Set displayName to anonymousUser
          displayName: `Guest${uniqueNumber}`, // Set displayName to "Guest1234"
          photoURL:
            "https://images.rawpixel.com/image_png_social_square/cHJpdmF0ZS9sci9pbWFnZXMvd2Vic2l0ZS8yMDIzLTAxL3JtNjA5LXNvbGlkaWNvbi13LTAwMi1wLnBuZw.png", // Set photoURL to a default image URL
        });
        router.push("/?isGuest=true");
      })
      .catch((error) => {
        console.log(error);
      });
  };

  useEffect(() => {
    if(!user && !loading && !onFirstVisit)
    {
      setOnFirstVisit(true);
      signingInAnonymously();
    }
    else if(!loading&&user){
      setOnFirstVisit(true);
    }
  }, [user, loading , router])

  const addDetails = async()=>{
    if(user){
      const userRef = doc(db, "users", user.uid);
        const docSnap = await getDoc(userRef);
  
        //console.log("UserDT: ", user, "N: ", user.displayName, "E: ", user.email, "P: ", user.photoURL);
        if (!docSnap.exists()) {
          // User document doesn't exist, create it with basic data
          await setDoc(userRef, {
            name: user.displayName || "", // Use user's display name or empty string
            email: user.email || "", // Use user's email or empty string
            profilePic: user.photoURL || "", // Use user's photo URL or empty string
            //savedPosts: [], Initialize savedPost array
          });
        } else {
          // User document exists, check if name, email, and profilePic fields are missing
          const userData = docSnap.data();
          if (!userData.name || !userData.email || !userData.profilePic || userData.email==="" || userData.profilePic==="" ) {
            // Update user document with missing fields
            await updateDoc(userRef, {
              name: userData.name || user.displayName || "", // Use existing or new display name
              email: userData.email || user.email || "", // Use existing or new email
              profilePic: userData.profilePic || user.photoURL || "", // Use existing or new photo URL
            });
          }
        }
    }
  }

  const timeout = setTimeout(() => {
    addDetails();
    //console.log("hii");
  }, 3000);

  const [name, setName] = useState<string>(user?.displayName||"loading...");

  //fetching followers, following data
  useEffect(() => {
    const fetchFollowersAndFollowing = async () => {
      if (user?.uid) {
        const userRef = doc(db, "users", user.uid);
        const userDoc = await getDoc(userRef);

        if (userDoc.exists()) {
          const userData = userDoc.data();
          const following = userData?.following?.length;
          const followers = userData?.followers?.length;
          const realName = userData?.name;
          // Assuming followers and following fields exist in user data
          setName(realName);
          // setFollowersCount(followers || 0);
          // setFollowingCount(following || 0);
        }
      }
    };

    fetchFollowersAndFollowing();
  }, [user?.uid]);



  useEffect(() => {
    if (user) {
      const createUserDocument = async () => {
        const userRef = doc(db, "users", user.uid);
        const docSnap = await getDoc(userRef);
  
        //console.log("UserD: ", user, "N: ", user.displayName, "E: ", user.email, "P: ", user.photoURL);
        if (!docSnap.exists()) {
          // User document doesn't exist, create it with basic data
          await setDoc(userRef, {
            name: user.displayName || "", // Use user's display name or empty string
            email: user.email || "", // Use user's email or empty string
            profilePic: user.photoURL || "", // Use user's photo URL or empty string
            //savedPosts: [], Initialize savedPost array
          });
        } else {
          // User document exists, check if name, email, and profilePic fields are missing
          const userData = docSnap.data();
          if (!userData.name || !userData.email || !userData.profilePic || userData.email==="" || userData.profilePic==="" ) {
            // Update user document with missing fields
            await updateDoc(userRef, {
              name: userData.name || user.displayName || "", // Use existing or new display name
              email: userData.email || user.email || "", // Use existing or new email
              profilePic: userData.profilePic || user.photoURL || "", // Use existing or new photo URL
            });
          }
        }
      };
      createUserDocument();
    }
  }, [user, loading, router]);
  
  
  //algolsearchClientff
  
  const [searchClient, setSearchClient] = useState<any>(null);
  useEffect(() => {
    setSearchClient(algoliasearch('8XQGGZTFH3', 'bd743f217017ce1ea457a8febb7404ef'))
  } , [])

  // const client = algoliasearch('8XQGGZTFH3', 'bd743f217017ce1ea457a8febb7404ef')




  const [description, setDescription] = useState("");
  // console.log(description);

  const form = useForm<Input>({
    // mode: "onSubmit",
    // mode: "onChange",
    resolver: zodResolver(QuestionType),
    defaultValues: {
      title: "",
      description: "",
      questionImageURL: "",
      anonymity: false,
    },
  });

  async function createQuestionPost(data: Input) {
    
    //console.log("creating");

    const docRef = await addDoc(collection(db, "questions"), {
      title: data.title,
      description: data.description,
      uid: user?.uid,
      profilePic: user?.photoURL,
      name: name||user?.displayName,
      createdAt: serverTimestamp(),
      questionImageURL: imageUrl,
      category: selectC,
      anonymity: data.anonymity,
      // ansNumbers: 0,
    });

    const quesId = docRef.id;

    toast({
      title: "Question Posted",
      description: "Your question has been posted successfully.",
    });

    try {
      for (const [mainCategory, subcategories] of Object.entries(selectedCategories)) {
        // Update Firestore for main category
        await updateDoc(doc(db, 'meta-data', 'v1', 'post-categories', mainCategory), {
          Posts: arrayUnion(docRef.id),
        });
  
        // Update Firestore for each subcategory
        for (const subcategory of subcategories) {
          await updateDoc(doc(db, 'meta-data', 'v1', 'post-categories', mainCategory), {
            [subcategory]: arrayUnion(docRef.id),
          });
        }
      }
  
      // Clear selected categories after submission
      setSelectedCategories({});
    } catch (error) {
      console.error('Error updating Firestore:', error);
    }

    //Keyword generation
    try {
      //console.log("keyword Gen.....")
      const docRef = await addDoc(collection(db, 'keywords'), {
        prompt: `Generate some keywords and hashtags on topic ${data.title} and give it to me in "**Keywords:**["Keyword1", "Keyword2",...] **Hashtags:**["Hashtag1", "Hashtag2",...]" this format`,
      });
      console.log('Keyword Document written with ID: ', docRef.id);
  
      // Listen for changes to the document
      const unsubscribe = onSnapshot(doc(db, 'keywords', docRef.id), async(snap) => {
        const data = snap.data();
        if (data && data.response) {
          console.log('RESPONSE: ' + data.response);
          const keywordsStr = `${data.response}`;

          const cleanedString = keywordsStr.replace(/\*|\`/g, '');

          const splitString = cleanedString.split("Keywords:");
          const keywordsString = splitString[1].split("Hashtags:")[0].trim();
          const hashtagsString = splitString[1].split("Hashtags:")[1].trim();

          const keywordsArray = JSON.parse(keywordsString);
          const hashtagsArray = JSON.parse(hashtagsString);

          const questionDocRef = doc(db, 'questions', quesId);
          await updateDoc(questionDocRef, {
          keywords: keywordsArray,
          hashtags: hashtagsArray // Add your keywords here
      });
        }
      });
  
      // Stop listening after some time (for demonstration purposes)
      setTimeout(() => unsubscribe(), 60000);
    } catch (error) {
      console.error('Error adding document: ', error);
    }

    console.log("Document written with ID: ", docRef.id);
    //console.log(data);
  }

  function onSubmit(data: Input) {
    // console.log(data);

    createQuestionPost(data);
    setNewPost((prev)=>!prev);
    
  }

  function tabsHandler(){

  }

  const guestHandler = ()=>{
    if(user?.isAnonymous){
    auth.signOut();
    router.push("/auth");
    }
  }

  const [searchTerm , setSearchTerm] = useState("");

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
      shares: hit.shares,
      questionImageURL: hit.questionImageURL,
      createdAt: hit.createdAt,
      anonymity: hit.anonymity,
      // ansNumbers: hit.ansNumbers,
      // add other necessary fields
    };
  }

  const searchClasses = {
    root: 'flex flex-col space-y-2 ',
    form: 'flex flex-col space-y-2 ',
    input: 'w-full border border-gray-300 rounded-lg p-2 pl-10',
    // submit: 'bg-emerald-500 text-white rounded-lg p-2',
    submit: 'hidden',
    reset: 'hidden',
    // loadingIndicator: 'text-red-500',
    // submitIcon: 'h-5 w-5',
    // resetIcon: 'h-5 w-5',
    // loadingIcon: 'h-5 w-5',
  };

  // form.watch();

  //post searching stuff
  const searchParamsP = useSearchParams();
  const isGuestP = searchParams.get('isGuest');

  const dispatch = useDispatch();
  const searchText = useSelector((state: RootState) => state.search.searchText);

  const handleSearchText = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    dispatch(setSearchText(e.target.value));
  }



  if(loading)
  {
    return(
      <div className='w-[10%]  items-center justify-center flex mx-auto md:container md:max-w-7xl md:mx-auto'>
        <Loader />
      </div>
    )
  }
  else
  {

  return (
    <div className="lg:mx-auto">
    <Suspense>
    <>
    <div className="w-full h-full dark:bg-[#4b3f3f]">
      <div className="md:h-[14.5rem] w-full relative">
        <div className="absolute top-[4rem] left-[34rem] text-white text-[40px] font-semibold">Elevate your Journey</div>
        <div className="absolute top-[8rem] left-[428px] text-white text-[20px] font-medium opacity-80">Join a community of seekers and find your path to enlightenment</div>
        <div>
        <div className="absolute top-[12rem] left-[459px] text-white">
          {/* <Input className=" pl-10 w-[40rem]" placeholder="Search" /> */}
          <input type="text" 
            value={searchText}
            onChange={handleSearchText} 
            placeholder="Search" 
            className="peer relative h-10 custom-placeholder text-white pl-12 rounded-full border-[2px] bg-transparent outline-none w-[34rem] ml-[0rem] cursor-text transition-all" 
            onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  dispatch(triggerSearch());
                }
            }}
          />
          <svg xmlns="http://www.w3.org/2000/svg" className={`absolute inset-y-0 my-auto ml-[0rem] transition-all h-[59px] w-[53px] border-transparent px-3.5 peer-focus:ml-[0rem] border-[#ffffff] stroke-[#ffffff]`} fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
          <path stroke-linecap="round" stroke-linejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        </div>
        </div>
      <Image
      className="h-[21rem]"
      src={BgImage}
      alt="post image"
      />
      </div>
    </div>
    {/* <h1 className='font-bold text-3xl md:text-4xl'>Your feed</h1> */}
      <div className=' mx-auto container mt-[114px]'>
      <div className='toggleSwitch mt-2 overflow-auto'>
          <Tabs defaultValue="posts" className="w-full">
      <TabsList className="grid gap-5 overflow-hidden grid-cols-4 h-[3rem] w-full">
        <TabsTrigger className="h-[35px]" value="posts" onClick={tabsHandler} >Posts</TabsTrigger>
        <TabsTrigger className="h-[35px]" value="answers" onClick={tabsHandler}>Answers</TabsTrigger>
        <TabsTrigger className="h-[35px]" value="anonymous" onClick={tabsHandler}>Anonymous</TabsTrigger>
        <TabsTrigger className="h-[35px]" value="forumPosts" onClick={tabsHandler}>Forum Posts</TabsTrigger>
      </TabsList>
    </Tabs>
    </div>
        {/* <TopFeedCard /> */}

        <div className="md:flex py-[11px] md:items-start items-center justify-center md:space-x-[2rem]">
        <div className="hidden lg:block col-span-2 sticky lg:top-[4.2rem] lg:w-[20rem]">
          <Sidebar playlists={[]} />
        </div>
      
        
      <div className="bg-layout flex justify-center mt-[3.5rem] md:mt-0 w-[90%] items-center mx-auto md:w-3/4 py-3 px-[2rem] rounded-lg bg-[#f5f5f5] dark:bg-[#262626] ">
        {/* {
          searchClient && (
            <InstantSearch searchClient={searchClient} indexName="search_questions" >

              <div className="relative">
              <SearchBox classNames={searchClasses} searchAsYouType={true} placeholder="Search ..." />
              <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-5 w-5 text-zinc-700" />

              </div>

              
              <Hits  hitComponent={({hit}) => <Post post={transformHitToPost(hit)} />} />
              
            </InstantSearch>
          )
        } */}
        <CustomFeed newPost = {newPost}/>
        </div>
        {/* <CustomFeed /> */}


        {/* subreddit info */}
        {/* <div className='col-span-3 lg:col-span-3 lg:w-[331px] lg:sticky overflow-hidden h-fit rounded-2xl order-first lg:order-last space-y-3'>
          <div className="shadow-lg shadow-blue-300">
          <div className='hidden lg:block col-span-4 lg:col-span-2 overflow-hidden h-fit order-last'>
            <RightHandFeed />
          </div>
          </div>

        </div> */}
        </div>
      </div>
    </>
    </Suspense>
    </div>
  );
                    }
}
