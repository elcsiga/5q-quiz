import { AfterViewInit, Component, ElementRef, inject, signal, ViewChild } from '@angular/core';
import { getRandomTopic, initSession, startConversation, closeSession, mute } from './ai';
import { ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-root',
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App implements AfterViewInit {

  protected status = signal<'noMic' | 'askForMic' | 'loading' | 'ready' | 'starting' | 'playing' | 'stopping' | 'error'>('loading');

  @ViewChild('test') testSound!: ElementRef<HTMLAudioElement>;
  @ViewChild('intro') introSound!: ElementRef<HTMLAudioElement>;
  @ViewChild('outro') outroSound!: ElementRef<HTMLAudioElement>;
  @ViewChild('correct') correctSound!: ElementRef<HTMLAudioElement>;
  @ViewChild('incorrect') incorrectSound!: ElementRef<HTMLAudioElement>;

  private readonly activatedRoute = inject(ActivatedRoute);

  ngAfterViewInit(): void {
    this.keepAlive();

    this.testSound.nativeElement.volume = 0.5;
    this.introSound.nativeElement.volume = 0.5;
    this.outroSound.nativeElement.volume = 0.3;
    this.correctSound.nativeElement.volume = 0.4;
    this.incorrectSound.nativeElement.volume = 0.5;

    this.checkPermissions();
  }

  checkPermissions() {
    navigator.permissions.query({ name: "microphone" }).then((result) => {
      if (result.state === "granted") {
        this.status.set("loading");
        setTimeout(() => this.status.set("ready"), 2000);
        console.log('Microphone permission granted.');
      } else if (result.state === "prompt") {
        this.status.set("noMic");
        console.log('Need microphone permission.')
      } else if (result.state === "denied") {
        this.status.set("error");
        console.log('Microphone permission denied.')
      }
    });
  }

  enableMic() {
    this.status.set("askForMic");
    this.testSound.nativeElement.play();
    navigator.mediaDevices
      .getUserMedia({ video: false, audio: true })
      .finally(() => {
        this.checkPermissions()
      });
  }

  private async keepAlive() {
    try {
      await navigator.wakeLock.request('screen');
      console.log('Wake Lock is active!');
    } catch (err: any) {
      console.log(`Wake Lock is not active: ${err.name}, ${err.message}`);
    }
  }

  private mute() {
    mute(true);
    console.log(`Muted.`);
  }

  start() {
    const name = this.activatedRoute.snapshot.queryParamMap.get('name') || 'Karesz';
    const topic = this.activatedRoute.snapshot.queryParamMap.get('topic') || getRandomTopic();

    console.log(`Name: ${name}`);
    console.log(`Topic: ${topic}`);
    console.log(`Starting quiz.`);

    initSession(name, topic, {
      correctAnswer: () => {
        console.log('Correct answer.');
        this.correctSound.nativeElement.play();
      },
      incorrectAnswer: () => {
        console.log('Incorrect answer.');
        this.incorrectSound.nativeElement.play();
      },
      endConversation: () => {
        console.log('End of quiz.');
        this.mute();

        setTimeout(() => {
          this.outroSound.nativeElement.play();
          this.status.set('stopping');
        }, 2000);

        setTimeout(() => {
          closeSession();
          this.status.set('ready');
        }, 16000);
      }
    })
      .then(() => {
        this.introSound.nativeElement.play();
        this.status.set('starting')

        setTimeout(() => {
          this.status.set('playing');
          this.introSound.nativeElement.volume = 0.2;

          startConversation();
        }, 5000);
      })
      .catch((e: any) => {
        console.error(e);
        this.status.set('error');
      })
  }

  stop() {
    this.status.set('stopping');
    closeSession();
    setTimeout(() => this.status.set('ready'), 1000);
  }
}
