import React, { useEffect, useState } from "react";
import axios from "axios";
import BlogCard from "./BlogCard"; // Import BlogCard
import { useNavigate } from "react-router-dom"; // Import useNavigate for navigation

const BASE_URL = import.meta.env.VITE_BASE_URL;

const RelatedPosts = ({ category, currentPostId }) => {
  const [relatedPosts, setRelatedPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate(); // Initialize useNavigate

  useEffect(() => {
    if (!category) return;

    axios
      .get(`${BASE_URL}/reception/blog/blog-posts/`)
      .then((response) => {
        const filteredPosts = response.data.filter(
          (post) => post.category === category && post.id !== currentPostId
        );
        setRelatedPosts(filteredPosts);
        setLoading(false);
      })
      .catch((error) => {
        setError("Failed to load related posts.");
        setLoading(false);
        console.error("Error fetching related posts:", error);
      });
  }, [category, currentPostId]);

  if (loading) return <p className="text-center">Loading related posts...</p>;
  if (error) return <p className="text-center text-red-500">{error}</p>;
  if (relatedPosts.length === 0) return null;

  return (
    <div className="mt-10">
      <h2 className="text-2xl font-Ray_black font-bold  text-center pb-2 mb-4">مقالات مرتبط</h2>
      <div className="md:max-w-6xl w-full mx-auto place-content-center grid gap-5 md:grid-cols-2 lg:grid-cols-3 mt-8">
        {/* Map relatedPosts to BlogCard */}
        {relatedPosts.map((post) => (
          <BlogCard
            key={post.id}
            item={post}
            onClick={() =>
              navigate(
                `/blog/${encodeURIComponent(post.title.replace(/\s+/g, "-").toLowerCase())}`,
                { state: { blog: post } }
              )
            }
          />
        ))}
      </div>
    </div>
  );
};

export default RelatedPosts;