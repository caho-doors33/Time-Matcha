import { supabase } from "./supabase";

export const deleteProjectById = async (projectId: string) => {
    const { error } = await supabase.from("projects").delete().eq("id", projectId);
    if (error) throw new Error(error.message);
};