// import SearchBase from "./SearchBase"
import axios from 'axios';
// const apiUrl = import.meta.env.VUE_APP_MEMENTO_API_URL;
// GPTMemento.js RetrievalLlamaIndex.js
class GPTMemento  {

    constructor(){}

    async retrieval(str){     
        try{
            let response = await axios.post('/retrieve', { query: str});
            return response.data;
        } catch(error){
            alert(error);
            return null;
        }
    }

    async query(str){     
        try{
            let response = await axios.post('/query', { query: str});
            return response.data;
        } catch(error){
            alert(error);
            return null;
        }
    }
}


export default GPTMemento;