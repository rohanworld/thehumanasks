
"use client";

import Image from "next/image";
import Link from "next/link";
import React, { useEffect, useState , Suspense } from "react";

import imageCompression from 'browser-image-compression';

import {Home as HomeIcon , Search, X } from "lucide-react";

import { buttonVariants } from "@/components/ui/button";

import CustomFeed from "@/components/CustomFeed";
import RightHandFeed from "@/components/RightHandFeed/RightHandFeed";
import TopFeedCard from "@/components/TopFeedCard";
import Loader from "@/components/ui/Loader";
import { LuXCircle } from "react-icons/lu";

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

type Input = z.infer<typeof QuestionType>;

type Props = {}

const CreateQuePage = (props: Props) => {

  const router = useRouter();
  const searchParams = useSearchParams();
  const isGuest = searchParams.get('isGuest');
  const [user, loading] = useAuthState(auth);
  const [newPost, setNewPost] = useState(false);
  
  const { toast } = useToast();

  type SelectedCategoriesType = Record<string, string[]>;
  type MyMapType = {
    [key: string]: number;
  };

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
  const [polls, setPolls] = useState<MyMapType[]>([]);
  const [questionType, setQuestionType] = useState<string>("question");
  const [pollInput, setPollInput] = useState<string>("");

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

  useEffect(()=>{
    console.log(polls);
  }, [polls])

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

  const handleQuestionChange = (newValue:string)=>{
    setQuestionType(newValue);
  }
    
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

  useEffect(() => {
    if(!user && !loading && !onFirstVisit)
    {
      setOnFirstVisit(true);
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

        router.push(`/`);
    
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
    
        try {
          console.log("keyword Gen.....")
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
    
      async function createPollPost(data: Input) {
        
        //console.log("creating");
    
        const docRef = await addDoc(collection(db, "polls"), {
          title: data.title,
          description: data.description,
          options: polls,
          uid: user?.uid,
          profilePic: user?.photoURL,
          name: name||user?.displayName,
          createdAt: serverTimestamp(),
          questionImageURL: imageUrl,
          category: selectC,
          anonymity: data.anonymity,
          // ansNumbers: 0,
        });
    
        const pollId = docRef.id;
    
        toast({
          title: "Poll Posted",
          description: "Your poll has been posted successfully.",
        });

        router.push(`/`);
    
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
    
        try {
          console.log("keyword Gen.....")
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
    
              const questionDocRef = doc(db, 'polls', pollId);
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
        if(questionType=="poll"){
          createPollPost(data);
        }
        else{
        createQuestionPost(data);
        }
        setNewPost((prev)=>!prev);
        
      }
    
      const guestHandler = ()=>{
        if(user?.isAnonymous){
        auth.signOut();
        router.push("/auth");
        }
      }
    
  return (
    <div>
        <div className="  w-full cursor-pointer">
                      <Form {...form}>
                        <form
                        className="relative space-y-9 "
                        onSubmit={form.handleSubmit(onSubmit)}
                        >

                          {/* Title */}
                          <FormField
                          control={form.control}
                          name="title"
                          render = {({field}) => (
                            <FormItem>
                              <FormLabel>Title</FormLabel>
                              <FormControl>
                                <Input className="" placeholder="Title for the question ..." {...field}/>
                              </FormControl>
                              <div className="font-style-7-hint opacity-70">This is the title, write your question here.</div>
                              <FormMessage/>
                            </FormItem>
                          )}
                          />

                          {/* TipTap Editor */}
                          <FormField
                            control={form.control}
                            name="description"
                            render = {({field}) => (
                              <FormItem>
                                <FormLabel>Description</FormLabel>
                                <div className={`${isFocused?"border-black border-[2.1px]": "border-[1.2px]"} rounded-lg`} onFocus={() => setIsFocused(true)}
                                  onBlur={() => setIsFocused(false)}
                                  >
                                <FormControl>
                                  <Controller
                                    control={form.control}
                                    name="description"
                                    render={({ field }) => (
                                      <Tiptap {...field} setImageUpload={setImageUpload} uploadImage={uploadImage} progress={progress} />
                                    )}
                                   /> 
                                </FormControl>
                                </div>
                                <div className="font-style-7-hint opacity-70">This is the description, give more details about your question here.</div>
                                <FormMessage/>
                              </FormItem>
                            )}
                          />
                          
                          {(progress||0)>0&&<span className='pt-3'>{`${Math.ceil((progress||0))} % Uploaded`}</span>}
                          {/* "0" to make upload percentage invisible when no image is selected */}
                          {/* anonymity toggle */}

                          <div>
                            {
                              previewImg&&<div className="w-full flex items-center justify-center">
                                <Image src={previewImg} alt="previewImage" width={250} height={250}/>
                              </div>
                            }
                          </div>
                          <div>
                            <div className="text-sm font-medium mb-2">Category</div>
                          <Select value={""} onValueChange={handleMainCategoryChange} >
      <SelectTrigger className="w-full">
      <SelectValue placeholder="Select a Category" />
      </SelectTrigger>
      <SelectContent>
        <SelectGroup>
          <SelectLabel>Categories</SelectLabel>
          <div>
              {
                selectCategory?
                selectCategory.map((categoryD:any, index:any)=>(
                  <div key={index}>
                    <SelectItem value={categoryD.id}>{categoryD.id.split("|").join("/")}</SelectItem>
                  </div>
                )):
                <div><Loader/></div>
              }
            </div>
          <SelectItem value="Others">Others</SelectItem>
        </SelectGroup>
      </SelectContent>
    </Select>
    <div className="flex">
                              {
                                selectC.map((category:string, index:number)=>{
                                  return <span className='bg-slate-300 text-slate-800 rounded-xl p-1 text-sm flex mr-1 mt-3' key={index}>{category.split("|").join("/")} <span onClick={()=>{delCategories(category)}} className="mt-[0.27rem] ml-1 cursor-pointer text-slate-800 hover:text-slate-900"><LuXCircle /></span></span>
                                })
                              }
                            </div>
                            <div className="mt-3">
                            {selectedMainCategory && (
                              <Select value={""} onValueChange={handleSubcategoryChange}>
                                <SelectTrigger>
                                <SelectValue placeholder={`Select subCategory for ${selectedMainCategory.split("|").join("/")}`} />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectGroup>
                                  <SelectLabel>Sub Categories</SelectLabel>
                                    {
                                      subCategoryy.map((subcategory:any, index:any)=>(
                                        <SelectItem key={index} value={subcategory}>{subcategory}</SelectItem>
                                      ))
                                    }
                                    {/* Add more subcategories for other main categories */}
                                  </SelectGroup>
                                </SelectContent>
                              </Select>
                            )}
                            <div className="flex">
                              {
                                tempSubCategory.map((subcategory:string, index:number)=>{
                                  return <span className='bg-slate-300 text-slate-800 rounded-xl p-1 text-sm flex mr-1 mt-3' key={index}>{subcategory} <span onClick={()=>{delSubCategories(subcategory)}} className="mt-[0.27rem] ml-1 cursor-pointer text-slate-800 hover:text-slate-900"><LuXCircle /></span></span>
                                })
                              }
                            </div>
                            </div>
                            <div className="font-style-7-hint opacity-70 mt-2">This is the category, you can choose multiple categories for your Question.</div>
                          </div>

                          {/*choose question type*/}

                          <div>
                            <div className="text-sm font-medium mb-2">Select Post Type</div>
                          <Select value={questionType} onValueChange={handleQuestionChange} >
      <SelectTrigger className="w-full">
      <SelectValue placeholder="Select Post Type" />
      </SelectTrigger>
      <SelectContent>
        <SelectGroup>
          <SelectLabel>Question Type</SelectLabel>
          <div>
              
            <SelectItem value={"question"}>Question</SelectItem>
            <SelectItem value={"poll"}>Poll</SelectItem>
                  
            </div>
        </SelectGroup>
      </SelectContent>
    </Select>
    </div>

                          {/* polls */}

                    
                    {
                      questionType=="poll"&&
              <><div>
                <div className="mb-1">Polls</div>
                <div>
                  <div className=" flex gap-2">
                    <Input
                      placeholder="Add Poll"
                      value={pollInput}
                      onChange={(e) => setPollInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          if(polls.length<3){
                          const newPoll = { [pollInput]: 0 };
                          setPolls([...polls, newPoll]);
                          setPollInput("");
                          }
                          else{
                            toast({
                              title: "Polls Limit Reached",
                              variant: "destructive",
                            });
                          }
                        }
                      } } />
                    <Button
                      type="button"
                      onClick={() => {
                        if(polls.length<3){
                          const newPoll = { [pollInput]: 0 };
                          setPolls([...polls, newPoll]);
                          setPollInput("");
                          }
                          else{
                            toast({
                              title: "Polls Limit Reached",
                              variant: "destructive",
                            });
                          }
                      } }
                    >
                      Add
                    </Button>
                  </div>
                </div>

                <div className=" flex flex-col gap-1">
                  {polls.map((poll, index) => (
                    <div
                      key={index}
                      className=" flex gap-1 justify-between p-2 mt-2 rounded-xl bg-[#F6F6F7]"
                    >
                      <p>{Object.keys(poll)[0]}</p>
                      <button
                        type="button"
                        onClick={() => {
                          const newPolls = [...polls];
                          newPolls.splice(index, 1);
                          setPolls(newPolls);
                        } }
                      >
                        <X />
                      </button>
                    </div>
                  ))}
                </div>

                <div className="font-style-7-hint opacity-70 mt-2">
                  Add polls for your question.
                </div>
                <div />
              </div><div /></>
                }


                          <FormField
                            control={form.control}
                            name="anonymity"
                            render={({ field }) => (
                              <FormItem className="flex flex-row items-center justify-between rounded-lg border p-2">
                                <div className="space-y-0.5">
                                  <FormLabel className="text-sm font-medium">
                                    Post Anonymously
                                    <div className="text-[12px] font-normal opacity-70">Hide your details while posting question</div>
                                  </FormLabel>
                                  {/* <FormDescription>
                                    Post question without revealing your identity.
                                  </FormDescription> */}
                                </div>
                                <div className="mb-5">
                                <FormControl>
                                  <Switch
                                    checked={field.value}
                                    onCheckedChange={field.onChange}
                                  />
                                </FormControl>
                                </div>
                              </FormItem>
                            )}
                          />

                              <Button type="submit" 
                                className="font-style-4 font-style-4 w-full"
                                // disabled={isGuest === 'true'}
                              >
                                Post
                              </Button>
                            
                          
                        </form>
                      </Form>
                      </div>

    </div>
  )
}

export default CreateQuePage