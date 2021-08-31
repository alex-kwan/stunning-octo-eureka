import React, { Component } from 'react';
import { AzureCommunicationTokenCredential } from '@azure/communication-common';
import { createStatefulCallClient, CallClientState } from '@azure/communication-react';

export class AcceptCall extends Component {
  static displayName = AcceptCall.name;

  constructor(props) {
    super(props);
  }

  componentDidMount() {
    this.fetchToken();
  }

  componentWillUnmount() {
  }

  render() {
    return <div>accepting call screen
      <button onClick={() => {
        fetch(`callUser?id=${this.state.id}`)
      }}>Click to have a bot call this user</button>
    </div>
  }

  async fetchToken() {
    const response = await fetch('token');
    const data = await response.json();
    console.log(JSON.stringify(data))

    const userAccessToken = data.token;
    const tokenCredential = new AzureCommunicationTokenCredential(userAccessToken);

    const statefulCallClient = createStatefulCallClient({
      userId: data.user.id,
    });

    this.setState({
      id: data.user.id
    })

    console.log('id = '+data.user.id);

    const callAgent = await statefulCallClient.createCallAgent(tokenCredential, {displayName: 'Optional User Name'})

    statefulCallClient.onStateChange((state) => {
      if (state.incomingCalls.length > 0) {
        state.incomingCalls.map(incomingCall => {
          console.log('incoming call '+incomingCall.id);
        })
      }
    });

    callAgent.on("incomingCall", async (event) => {
      console.log('incoming call about to accept');
      var call = await event.incomingCall.accept();
      this.setState({
        incomingCall: call
      });
      console.log('incoming call accepted');
    })

    console.log('set up for accepting a call');
  }
}
