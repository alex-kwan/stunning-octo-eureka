import React, { Component } from 'react';
import { CallClient } from "@azure/communication-calling";
import { AzureCommunicationTokenCredential } from '@azure/communication-common';
import { v4 as uuidv4 } from 'uuid';

export class JoinCall extends Component {
  static displayName = JoinCall.name;

  constructor(props) {
    super(props);
    this.state = {callAgent: undefined, call: undefined, id: 'n/a', remoteParticipants: [], callState: 'n/a'}
  }

  componentDidMount() {
    this.fetchToken();
  }

  componentWillUnmount() {
    this.endCall();
  }

  static renderForecastsTable(forecasts) {
    return (
      <table className='table table-striped' aria-labelledby="tabelLabel">
        <thead>
          <tr>
            <th>Date</th>
            <th>Temp. (C)</th>
            <th>Temp. (F)</th>
            <th>Summary</th>
          </tr>
        </thead>
        <tbody>
          {forecasts.map(forecast =>
            <tr key={forecast.date}>
              <td>{forecast.date}</td>
              <td>{forecast.temperatureC}</td>
              <td>{forecast.temperatureF}</td>
              <td>{forecast.summary}</td>
            </tr>
          )}
        </tbody>
      </table>
    );
  }

  render() {

    return (
      <div>
      <div>
        some UI to show I have joined a call and the number of participants
        <div>add a user from the server to this call and remove them after 10 seconds</div>
        <button onClick={async () => {
            console.log('going to add a user to this call with callid '+this.state.id)
          } }>add user</button>
          {this.state.remoteParticipants.length > 0 && <div><div>RemoteParticipants</div>
          <div>
            {this.state.remoteParticipants.map(remoteParticipant => {
              return <div>{remoteParticipant.id}</div>
            })}
          </div></div> }
          {this.state.remoteParticipants.length === 0 && <div>No Remote Participants :(</div>}
      </div>
      </div>
    );
  }

  async endCall() {
    await this.state.call.hangUp();
    console.log('ended the call')
  }

  async fetchToken() {
    const response = await fetch('token');
    const data = await response.json();
    console.log(JSON.stringify(data))

    let groupId = uuidv4();
    console.log('group id = '+groupId)

    const callClient = new CallClient(); 
    var callAgent, tokenCredential
    try {
      
      tokenCredential = new AzureCommunicationTokenCredential(data.token);
      callAgent = await callClient.createCallAgent(tokenCredential);

      this.setState({
        call: this.state.call,
        id: this.state.id,
        remoteParticipants: this.state.remoteParticipants,
        callState: this.state.callState
      })

      callAgent.on('callsUpdated', (callEvent => {
        callEvent.removed.map(async call => {
          console.log('call removed')
        })
    
        const call = callEvent.added[0];
        this.setState({
          call,
          id: this.state.id,
          remoteParticipants: this.state.remoteParticipants,
          callState: call.state
        })

        console.log('i created the call')

        call.on('stateChanged', (event) => {
          console.log('the call state has changed to '+call.state)
          this.setState({
            id: call.id,
            remoteParticipants: this.state.remoteParticipants,
            callState: call.state
          })
        })
        call.on('idChanged', (event) => {
          console.log('the call state has changed to '+call.id)
          this.setState({
            id: call.id,
            remoteParticipants: this.state.remoteParticipants,
            callState: this.state.callState
          })
        })
        call.on('remoteParticipantsUpdated', (event) => {
          console.log('remote participants have changed');
          this.setState({
            id: this.state.id,
            remoteParticipants: call.remoteParticipants,
            callState: this.state.callState
          })
        })
      }))

      console.log('i registered for all events')

      callAgent.join({groupId}, { audioOptions: { muted: true}})

      console.log("i joined the call")

      
    } catch(error) {
      console.log(JSON.stringify(error))
      window.alert("Please submit a valid token!");
    }
  }
}
