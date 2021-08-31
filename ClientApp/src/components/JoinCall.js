import React, { Component } from 'react';
import { CallClient } from "@azure/communication-calling";
import { AzureCommunicationTokenCredential } from '@azure/communication-common';

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

  render() {
    return (
      <div>
      <div>
        some UI to show I have joined a call and the number of participants
        <div>add a user from the server to this call and remove them after 10 seconds</div>
        <div>The call state is {this.state.callState}</div>
        <button onClick={async () => {
          if(this.state.callState === 'Connected') {
            var serverCallId = '5013c8f1-fd98-44d9-9f0a-ebbb5790b253';
            await fetch(`addUser?serverCallId="${serverCallId}"`);
          }
          } }>add user</button>
          {this.state.remoteParticipants.length > 0 && <div><div>RemoteParticipants</div>
          <div>
            {this.state.remoteParticipants.map((remoteParticipant, i) => {
              console.log(remoteParticipant)
              return <div key={i}>{remoteParticipant.identifier.communicationUserId}</div>
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

    // currently hardcoding the group id
    let groupId = "5013c8f1-fd98-44d9-9f0a-ebbb5790b253";
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
          console.log('remote participants have changed ');
          
          this.setState({
            id: this.state.id,
            remoteParticipants: [...call.remoteParticipants],
            callState: this.state.callState
          })
        })
      }))
      callAgent.join({groupId}, { audioOptions: { muted: true}})
    } catch(error) {
      console.log(JSON.stringify(error))
      window.alert("Please submit a valid token!");
    }
  }
}
