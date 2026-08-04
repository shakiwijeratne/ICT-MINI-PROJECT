import { useEffect, useState } from 'react';
import {
  Award,
  Save,
  Star,
} from 'lucide-react';

import { useAuth } from '../../contexts/useAuth';

import {
  getInternships,
  createEvaluation,
  getEvaluations,
  createNotification,
} from '../../services/dataService';

import {
  PageHeader,
  Card,
  EmptyState,
} from '../../components/ui';

import type {
  Internship,
  SkillEvaluation,
} from '../../types';


export function SupervisorEvaluationPage() {

  const { user } = useAuth();

  const [students,setStudents] =
    useState<Internship[]>([]);

  const [evaluations,setEvaluations] =
    useState<SkillEvaluation[]>([]);


  const [selectedStudent,setSelectedStudent] =
    useState<Internship | null>(null);


  const [technicalSkills,setTechnicalSkills] =
    useState(3);

  const [communicationSkills,setCommunicationSkills] =
    useState(3);

  const [teamworkSkills,setTeamworkSkills] =
    useState(3);

  const [problemSolvingSkills,setProblemSolvingSkills] =
    useState(3);


  const [feedback,setFeedback] =
    useState('');


  const [message,setMessage] =
    useState('');



  useEffect(()=>{

    if(!user) return;


    Promise.all([
      getInternships({
        supervisorId:user.uid
      }),

      getEvaluations()

    ])

    .then(([internshipData,evaluationData])=>{

      setStudents(internshipData);

      setEvaluations(evaluationData);

    });


  },[user]);





  const submitEvaluation = async()=>{

    if(!selectedStudent || !user)
      return;



    await createEvaluation({

      studentId:selectedStudent.studentId,

      weekReportId:"final",

      evaluatorId:user.uid,

      evaluatorRole:"supervisor",


      technicalSkills:{
        Programming:technicalSkills
      },


      softSkills:{
        Communication:communicationSkills,
        Teamwork:teamworkSkills,
        ProblemSolving:problemSolvingSkills
      },


      comments:feedback,

    });



    await createNotification({

      userId:selectedStudent.studentId,

      title:"New Evaluation Completed",

      message:
      "Your supervisor completed your internship skill evaluation",

      type:"success"

    });



    setMessage(
      "Evaluation submitted successfully"
    );


    setFeedback('');

  };



  const Rating = ({
    value,
    setValue
  }:{

    value:number;

    setValue:(v:number)=>void;

  })=>{


    return (

      <div className="rating">

        {
          [1,2,3,4,5].map(num=>(

            <button

              key={num}

              type="button"

              onClick={()=>setValue(num)}

              className={
                num <= value
                ?
                "star active"
                :
                "star"
              }

            >

              <Star size={20}/>

            </button>

          ))
        }

      </div>

    );

  };




return (

<div className="page">


<PageHeader

title="Student Evaluation"

subtitle="Evaluate technical and soft skills of assigned interns"

/>



{message &&

<div className="alert alert-success">

{message}

</div>

}




<Card>


<h3>

<UsersIcon />

Select Student

</h3>



{
students.length===0 ?

<EmptyState message="No assigned students"/>

:

<select

className="form-control"

onChange={(e)=>{

const student =
students.find(
s=>s.id===e.target.value
);

setSelectedStudent(
student ?? null
);

}}

>


<option>
Choose student
</option>


{

students.map(student=>(

<option

key={student.id}

value={student.id}

>

{student.studentName}

</option>

))

}


</select>

}


</Card>





{
selectedStudent &&

<Card>


<h3>

<Award size={20}/>

Skill Evaluation

</h3>



<div className="evaluation-item">

<label>
Technical Skills
</label>


<Rating

value={technicalSkills}

setValue={setTechnicalSkills}

/>

</div>



<div className="evaluation-item">

<label>
Communication Skills
</label>


<Rating

value={communicationSkills}

setValue={setCommunicationSkills}

/>

</div>



<div className="evaluation-item">

<label>
Teamwork Skills
</label>


<Rating

value={teamworkSkills}

setValue={setTeamworkSkills}

/>

</div>



<div className="evaluation-item">

<label>
Problem Solving
</label>


<Rating

value={problemSolvingSkills}

setValue={setProblemSolvingSkills}

/>

</div>





<textarea

className="feedback-input"

placeholder="Write supervisor feedback..."

value={feedback}

onChange={
(e)=>setFeedback(e.target.value)
}

/>




<button

className="btn btn-primary"

onClick={submitEvaluation}

>

<Save size={16}/>

Submit Evaluation

</button>



</Card>

}



</div>

);


}



// temporary icon wrapper
function UsersIcon(){

return <Award size={20}/>;

}