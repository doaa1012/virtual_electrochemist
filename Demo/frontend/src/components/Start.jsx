import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";

const Start = () => {
  const navigate = useNavigate();
  const [checkingSession, setCheckingSession] = useState(true);
  const [participant, setParticipant] = useState(null);
  const [formData, setFormData] = useState({

    author: false,

    name: "",
    affiliation: "",
    email: ""

  });
  const [restore, setRestore] = useState({

    participant_id: "",
    recovery_key: ""

  });
  const handleChange = (e) => {
  const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,

      [name]:
        type === "checkbox"
          ? checked
          : value

    }));
 };

  const handleRestore = (e) => {

    const { name, value } = e.target;


    setRestore(prev => ({

      ...prev,

      [name]: value

    }));

  };
  useEffect(() => {

    const checkSession = async () => {

        try {

            const res = await fetch(

                "/api/session/status/",

                {
                    credentials: "include"
                }

            );


            if (res.ok) {

                const data = await res.json();


                if (data.session_saved) {

                    navigate("/experiment");
                    return;
                }

            }

        }

        catch (err) {

            console.log(err);

        }

    };

const loadParticipant = async () => {

    try {

        const res = await fetch(
            "/api/virtualuser/",
            {
                credentials: "include"
            }
        );


        if (res.ok) {

            const data = await res.json();

            console.log("participant", data);

            setParticipant(data);


            setFormData({

                author: data.author_consent || false,

                name: data.name || "",

                affiliation: data.affiliation || "",

                email: data.email || ""

            });


            setRestore({

                participant_id:
                    data.participant_id || "",

                recovery_key:
                    data.recovery_key || ""

            });

        }

    }

    catch(err){

        console.log(err);

    }

    finally{
        setCheckingSession(false);
    }
};
    checkSession();

    loadParticipant();

}, []);

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {

      const response = await fetch(

        "/api/virtualuser/update/",

        {
          method: "POST",

          credentials: "include",

          headers: {

            "Content-Type": "application/json"

          },

          body: JSON.stringify(formData)

        }

      );

      const data = await response.json();
      if (response.ok) {

        toast.success(
          "Session created successfully"

        );

        navigate("/experiment");
      }
      else {

        toast.error(
          data.error ||
          "Unable to create session"
        );
      }
    }
    catch {
      toast.error(
        "Network error"
      );
    }
  };

  const restoreSession = async () => {
    try {
      const response = await fetch(
        "/api/restore-session/",
        {
          method: "POST",
          credentials: "include",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify(restore)
        }
      );

if(response.ok){

    localStorage.setItem(
        "participant_id",
        data.participant_id
    );
    localStorage.setItem(
        "recovery_key",
        data.recovery_key
    );
    setRestore({
        participant_id:data.participant_id,
        recovery_key:data.recovery_key
    });
    toast.success(
        "Session created successfully"
    );
    navigate("/experiment");
}



      toast.error(

        "Invalid credentials"

      );



    }
    catch {


      toast.error(

        "Unable to restore session"

      );

    }


  };


if(checkingSession){

return(

<div className="min-h-screen flex items-center justify-center">

<p className="text-orange-600">

Loading participant...

</p>

</div>

)}
  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-orange-100 flex items-center justify-center p-6">

      <div className="max-w-2xl w-full bg-white rounded-3xl shadow-lg p-10">


        <h1 className="text-4xl font-bold text-center text-orange-600 mb-3">

          Participant Access

        </h1>



        <p className="text-center text-gray-500 mb-8">

          Participation is anonymous by default.

          Personal details are optional.


        </p>

{participant && (

<div className="mb-6 p-4 bg-green-50 border border-green-300 rounded-xl">

<h3 className="font-semibold text-green-700 mb-2">
Existing Session Found
</h3>

<p>
You already completed consent for this browser session.
No additional consent is required.
</p>


<p>

Participant ID:

<strong>

{participant.participant_id}

</strong>

</p>


<p>

Recovery Key:

<strong>

{participant.recovery_key}

</strong>

</p>

</div>

)}
        <form
          onSubmit={handleSubmit}
          className="space-y-6"
        >




          <div className="bg-orange-50 rounded-xl p-5">


            <label className="flex gap-3">


              <input

                type="checkbox"

                name="author"

                checked={formData.author}

                onChange={handleChange}

              />


              <span>

                I would like to be acknowledged
                as a contributor


                (optional)

              </span>

            </label>

          </div>





          {formData.author && (

            <>


              <div>

                <label>

                  Name

                </label>


                <input

                  name="name"

                  value={formData.name}

                  onChange={handleChange}

                  className="w-full mt-1 px-4 py-2 border rounded-xl"

                />

              </div>





              <div>

                <label>

                  Affiliation

                </label>


                <input

                  name="affiliation"

                  value={formData.affiliation}

                  onChange={handleChange}

                  className="w-full mt-1 px-4 py-2 border rounded-xl"

                />

              </div>




              <div>

                <label>

                  Email

                </label>


                <input

                  type="email"

                  name="email"

                  value={formData.email}

                  onChange={handleChange}

                  className="w-full mt-1 px-4 py-2 border rounded-xl"

                />

              </div>


            </>

          )}






          <div className="bg-gray-50 rounded-xl p-4 text-sm">


            After starting the experiment,
            you will receive:


            • Participant ID


            • Recovery Key



            Save them securely.


            They are required to:


            Restore sessions


            Export data


            Delete data



          </div>





          <button

            type="submit"

            className="w-full bg-orange-500 hover:bg-orange-600 text-white py-3 rounded-full"

          >

            Start Experiment

          </button>
        </form>
        <hr className="my-10" />
        <h2 className="font-semibold text-xl mb-4">

          Restore Existing Session
        </h2>

        <input
          name="participant_id"

          placeholder="Participant ID"

          value={restore.participant_id}

          onChange={handleRestore}

          className="w-full mb-3 px-4 py-2 border rounded-xl"

        />
        <input

          name="recovery_key"

          placeholder="Recovery Key"

          value={restore.recovery_key}

          onChange={handleRestore}

          className="w-full mb-4 px-4 py-2 border rounded-xl"

        />





        <button

          onClick={restoreSession}

          className="w-full border border-orange-500 text-orange-600 py-3 rounded-full"

        >

          Restore Session

        </button>


      </div>


    </div>

  );


};


export default Start;