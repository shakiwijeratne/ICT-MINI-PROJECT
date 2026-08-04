import { useEffect, useState } from "react";
import { CheckCircle, XCircle } from "lucide-react";

import { 
  getDiaries,
  approveDiary,
  rejectDiary
} from "../../services/dataService";

import { 
  PageHeader,
  Card,
  EmptyState
} from "../../components/ui";

import type { DiaryEntry } from "../../types";


export function SupervisorDiaryReview(){

const [diaries,setDiaries]=useState<DiaryEntry[]>([]);


const load=async()=>{

const data=await getDiaries();

setDiaries(
data.filter(
(d)=>d.status==="pending"
)
);

};


useEffect(()=>{

load();

},[]);



return (

<div className="page">

<PageHeader

title="Diary Review"

subtitle="Review student daily internship activities"

/>


<Card>

{
diaries.length===0?

<EmptyState message="No pending diaries"/>

:

diaries.map((diary)=>(

<div 
key={diary.id}
className="report-item"
>


<h3>
{diary.title}
</h3>


<p>
{diary.content}
</p>


<p>
Hours:
{diary.hoursWorked}
</p>



<button

className="btn btn-primary"

onClick={async()=>{

await approveDiary(
 diary.id,
 "supervisor"
);

load();

}}

>

<CheckCircle size={16}/>
Approve

</button>



<button

className="btn btn-outline"

onClick={async()=>{

await rejectDiary(
 diary.id,
 "supervisor",
 "Please improve diary details"
);

load();

}}

>

<XCircle size={16}/>
Reject

</button>


</div>


))

}

</Card>


</div>

);


}