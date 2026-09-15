import React from "react";
import PlaceholderScreen from "../PlaceholderScreen";

export default function AdminSectionPlaceholder({ title }: { title: string }) {
  return (
    <PlaceholderScreen
      title={title}
      message="Native admin section placeholder."
    />
  );
}
