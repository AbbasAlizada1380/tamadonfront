import { useState } from "react";

import Filtering from "./Filtering";

const BlogNavbar = ({ onCategoryChange, onSearch }) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div>
      <div className="flex justify-evenly gap-5 md:gap-10">
        <div>
          <Filtering onCategoryChange={onCategoryChange} />
        </div>
      </div>
    </div>
  );
};

export default BlogNavbar;
