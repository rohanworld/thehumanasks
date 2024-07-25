import React from "react";
import { Separator } from "@/components/ui/separator";
import CreateQuePage from "./createForumPost-form";

type Props = {};

const CreateForumPost = (props: Props) => {
  return (
    <div className="space-y-6 font-dmsans">
      
      <CreateQuePage />
    </div>
  );
};

export default CreateForumPost;
