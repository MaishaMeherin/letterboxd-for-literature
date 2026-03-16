import { useState, useEffect } from "react";
import api from "../api";
import { useParams } from "react-router-dom";
import { usePlaylistStore } from "../store";

function PlaylistPage(){
    const { playlist, setPlaylist } = usePlaylistStore();

    
}