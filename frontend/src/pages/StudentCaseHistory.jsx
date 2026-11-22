import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { api } from "../api/client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { ArrowLeft } from "lucide-react";

export default function StudentCaseHistory() {

  const navigate = useNavigate();
  const { id } = useParams();

  const [student, setStudent] = useState(null);
  const [cases, setCases] = useState([]);
  const [summary, setSummary] = useState([]);
  const [loading, setLoading] = useState(true);


  useEffect(() => {

    api
      .get(`/discipline/cases/student/${id}/history/`)
      .then((data) => {

        setStudent(data.student);
        setCases(data.cases || []);
        setSummary(data.summary || []);

      })
      .finally(() => setLoading(false));

  }, [id]);



  return (

    <div className="p-6 space-y-6 max-w-screen-xl">


      <Button
        variant="outline"
        onClick={() => navigate("/discipline")}
        className="gap-2"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Discipline
      </Button>



      <Card>

        <CardHeader>

          <h1 className="text-2xl font-bold">
            Student Case History
          </h1>

        </CardHeader>


        <CardContent>


          {loading ? (

            <p>Loading...</p>


          ) : (

            <>


              {/* STUDENT INFORMATION */}

              <div className="rounded-lg border p-4">

                <h2 className="text-xl font-bold mb-4">
                  Student Information
                </h2>


                <p>
                  <strong>Name:</strong>{" "}
                  {student?.last_name}, {student?.first_name}
                </p>

                <p>
                  <strong>Student ID:</strong>{" "}
                  {student?.student_id}
                </p>

                <p>
                  <strong>Course:</strong>{" "}
                  {student?.course}
                </p>

                <p>
                  <strong>Year Level:</strong>{" "}
                  {student?.year_level}
                </p>

                <p>
                  <strong>Email:</strong>{" "}
                  {student?.email}
                </p>


              </div>




              {/* OFFENSE SUMMARY */}

              <div className="mt-6 rounded-lg border p-4">

                <h2 className="text-xl font-bold mb-4">
                  Offense Summary
                </h2>


                {summary.length === 0 ? (

                  <p className="text-muted-foreground">
                    No offenses recorded.
                  </p>


                ) : (

                  summary.map((item) => (

                    <div
                      key={item.violation}
                      className="flex justify-between border-b py-2"
                    >

                      <span>
                        {item.violation}
                      </span>


                      <span className="font-bold">
                        {item.count}
                      </span>


                    </div>

                  ))

                )}


              </div>






              {/* DISCIPLINARY HISTORY TABLE */}

              <div className="mt-6 rounded-lg border p-4">


                <h2 className="text-xl font-bold mb-4">
                  Disciplinary History
                </h2>



                <div className="border rounded-lg overflow-x-auto">


                  <table className="w-full text-sm">


                    <thead className="bg-muted">

                      <tr>

                        <th className="p-3 text-left">
                          Case No.
                        </th>

                        <th className="p-3 text-left">
                          Violation
                        </th>

                        <th className="p-3 text-left">
                          Severity
                        </th>

                        <th className="p-3 text-left">
                          Status
                        </th>

                        <th className="p-3 text-left">
                          Incident Date
                        </th>

                        <th className="p-3 text-left">
                          Sanction
                        </th>

                      </tr>

                    </thead>



                    <tbody>


                      {cases.length === 0 ? (

                        <tr>

                          <td
                            colSpan="6"
                            className="text-center p-5 text-muted-foreground"
                          >
                            No disciplinary records found.
                          </td>

                        </tr>


                      ) : (


                        cases.map((item) => (

                          <tr
                            key={item.id}
                            className="border-t"
                          >


                            <td className="p-3">
                              {item.case_number}
                            </td>


                            <td className="p-3">
                              {item.violation}
                            </td>


                            <td className="p-3">

                              <span className="px-2 py-1 rounded bg-red-100 text-red-700 text-xs">
                                {item.severity}
                              </span>

                            </td>


                            <td className="p-3">
                              {item.status}
                            </td>


                            <td className="p-3">
                              {item.incident_date}
                            </td>


                            <td className="p-3">
                              {item.sanction || "—"}
                            </td>


                          </tr>

                        ))

                      )}


                    </tbody>


                  </table>


                </div>


              </div>


            </>

          )}


        </CardContent>


      </Card>


    </div>

  );

}